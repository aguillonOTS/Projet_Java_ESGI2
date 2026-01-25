package com.esgi.pizzeria.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.esgi.pizzeria.domain.Order;
import com.esgi.pizzeria.domain.OrderLine;
import com.esgi.pizzeria.domain.Product;
import com.esgi.pizzeria.repository.JsonOrderRepository;
import com.esgi.pizzeria.repository.JsonProductRepository;

/**
 * Service métier responsable de la gestion des commandes.
 * <p>
 * CHOIX DE CONCEPTION :
 * Ce service agit comme un "Gatekeeper" (Gardien). Il ne se contente pas de passer
 * les données au repository, il les valide, les assainit et impose les règles métier
 * critiques (calcul du prix côté serveur, horodatage fiable).
 * </p>
 */
@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final JsonOrderRepository orderRepository;
    private final JsonProductRepository productRepository;

    /**
     * Injection des dépendances requises.
     * @param orderRepository Accès aux commandes stockées.
     * @param productRepository Accès au catalogue produit (pour vérifier les prix réels).
     */
    public OrderService(JsonOrderRepository orderRepository, JsonProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    /**
     * Récupère l'intégralité des commandes (pour l'administration).
     * @return Liste non modifiable des commandes.
     */
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    /**
     * Crée et valide une nouvelle commande.
     * <p>
     * SÉCURITÉ & ROBUSTESSE :
     * 1. Vérifie que le panier n'est pas vide.
     * 2. Génère un ID unique (UUID) côté serveur.
     * 3. Impose la date/heure du serveur (LocalDateTime.now) pour éviter les fraudes client.
     * 4. Recalcule le montant total en utilisant les prix officiels de la base de données
     * (protection contre la "Price Manipulation Attack").
     * </p>
     *
     * @param order L'objet commande reçu du Frontend (partiellement rempli).
     * @return La commande finalisée, sécurisée et persistée.
     * @throws IllegalArgumentException si la commande ne contient aucun article.
     */
    public Order createOrder(Order order) {
        // 1. Validation structurelle (Guard Clause)
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new IllegalArgumentException("Une commande doit contenir au moins un article.");
        }

        // 2. Génération d'ID technique si absent
        if (order.getId() == null || order.getId().isEmpty()) {
            order.setId(UUID.randomUUID().toString());
        }

        // 3. SÉCURITÉ TEMPORELLE : Le serveur est la seule source de vérité pour l'heure.
        order.setDate(LocalDateTime.now().toString());

        // 4. SÉCURITÉ FINANCIÈRE : Recalcul impératif du montant total.
        // Utilisation de BigDecimal pour éviter les erreurs d'arrondi des doubles (ex: 0.1 + 0.2).
        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (OrderLine item : order.getItems()) {
            // Récupération du prix officiel depuis le catalogue
            Optional<Product> productOpt = productRepository.findById(item.getId());

            if (productOpt.isPresent()) {
                Product realProduct = productOpt.get();
                BigDecimal realPrice = realProduct.getPrice();

                // Calcul : Prix Unitaire (Base) * Quantité
                BigDecimal lineTotal = realPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                calculatedTotal = calculatedTotal.add(lineTotal);
            } else {
                // Gestion d'erreur silencieuse : on loggue mais on ne plante pas tout le processus
                logger.warn("Produit inconnu détecté dans la commande (ID: {}). Ignoré du calcul.", item.getId());
            }
        }

        // Affectation du montant certifié par le serveur.
        // CORRECTION TYPE : Order.java attend désormais un BigDecimal, on passe l'objet directement.
        order.setTotalAmount(calculatedTotal);

        logger.info("Commande {} validée. Montant certifié serveur : {} €", order.getId(), order.getTotalAmount());
        
        return orderRepository.save(order);
    }
}