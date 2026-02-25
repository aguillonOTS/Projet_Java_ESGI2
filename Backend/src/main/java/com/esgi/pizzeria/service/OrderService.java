package com.esgi.pizzeria.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
 * Agit comme un "Gatekeeper" : valide, assainit et impose les règles métier
 * (prix certifiés, horodatage, remises, stock, fidélité).
 * </p>
 */
@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final JsonOrderRepository orderRepository;
    private final JsonProductRepository productRepository;
    private final CustomerService customerService;

    public OrderService(JsonOrderRepository orderRepository,
                        JsonProductRepository productRepository,
                        CustomerService customerService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerService = customerService;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // ---------------------------------------------------------------
    // EXERCICE 2.2 — Remise automatique
    // ---------------------------------------------------------------

    /**
     * Calcule le montant d'une réduction en pourcentage.
     *
     * @param montant              Montant de base
     * @param reductionPourcentage Taux de réduction (ex : 5.0 pour 5%)
     * @return Montant de la réduction (pas le total final)
     */
    private static BigDecimal appliquerReduction(BigDecimal montant, double reductionPourcentage) {
        return montant
                .multiply(BigDecimal.valueOf(reductionPourcentage / 100.0))
                .setScale(2, RoundingMode.HALF_UP);
    }

    // ---------------------------------------------------------------
    // EXERCICE 2.3 — Vérification et déduction du stock
    // ---------------------------------------------------------------

    /**
     * Retire une quantité du stock d'un produit si elle est disponible.
     * <p>
     * stock == null ou <= 0 → illimité, toujours autorisé.<br>
     * stock > 0            → vérifié et déduit.
     * </p>
     *
     * @param product  Le produit concerné
     * @param quantite La quantité commandée
     * @return true si le stock était suffisant (et a été déduit), false sinon
     */
    private boolean retirerDuStock(Product product, int quantite) {
        Integer stock = product.getStock();
        if (stock == null || stock <= 0) return true; // illimité

        if (stock >= quantite) {
            product.setStock(stock - quantite);
            productRepository.save(product);
            logger.info("Stock {} : {} → {}", product.getName(), stock, product.getStock());
            return true;
        }
        return false; // stock insuffisant
    }

    // ---------------------------------------------------------------
    // Création d'une commande
    // ---------------------------------------------------------------

    /**
     * Crée et valide une nouvelle commande.
     * <ol>
     *   <li>Validation : panier non vide.</li>
     *   <li>Recalcul du sous-total depuis le catalogue (anti-fraude).</li>
     *   <li>Vérification du stock pour chaque article (ex. 2.3).</li>
     *   <li>Remise auto 5% si sous-total > 20€ et aucune remise manuelle (ex. 2.2).</li>
     *   <li>Application de la remise (plafonnée au sous-total).</li>
     *   <li>Persistance de la commande.</li>
     *   <li>Crédit des points de fidélité sur le total final.</li>
     * </ol>
     *
     * @param order Commande reçue du frontend (partiellement remplie)
     * @return Commande finalisée et persistée
     * @throws IllegalArgumentException si le panier est vide
     * @throws IllegalStateException    si le stock est insuffisant pour un article
     */
    public Order createOrder(Order order) {

        // 1. Validation structurelle
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new IllegalArgumentException("Une commande doit contenir au moins un article.");
        }

        // 2. ID et horodatage côté serveur
        if (order.getId() == null || order.getId().isEmpty()) {
            order.setId(UUID.randomUUID().toString());
        }
        order.setDate(LocalDateTime.now().toString());

        // 3. Recalcul du sous-total + résolution des produits
        BigDecimal subtotal = BigDecimal.ZERO;
        List<Product> resolvedProducts = new ArrayList<>();

        for (OrderLine item : order.getItems()) {
            Optional<Product> productOpt = productRepository.findById(item.getId());
            if (productOpt.isPresent()) {
                Product p = productOpt.get();
                resolvedProducts.add(p);
                BigDecimal lineTotal = p.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                subtotal = subtotal.add(lineTotal);
            } else {
                logger.warn("Produit inconnu (ID: {}). Ignoré du calcul.", item.getId());
            }
        }

        // 4. EXERCICE 2.3 — Vérification du stock AVANT toute persistance
        for (int i = 0; i < resolvedProducts.size(); i++) {
            Product p = resolvedProducts.get(i);
            int qte = order.getItems().get(i).getQuantity();
            if (!retirerDuStock(p, qte)) {
                throw new IllegalStateException(
                    "Stock insuffisant pour \"" + p.getName() + "\" "
                    + "(disponible : " + p.getStock() + ", demandé : " + qte + ")."
                );
            }
        }

        // 5. EXERCICE 2.2 — Remise automatique 5% si sous-total > 20€ et aucune remise déjà appliquée
        BigDecimal existingDiscount = order.getDiscountAmount() != null
                ? order.getDiscountAmount()
                : BigDecimal.ZERO;

        if (subtotal.compareTo(CustomerService.AUTO_DISCOUNT_THRESHOLD) > 0
                && existingDiscount.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal autoDiscount = appliquerReduction(subtotal, CustomerService.AUTO_DISCOUNT_RATE);
            order.setDiscountAmount(autoDiscount);
            order.setDiscountReason("Remise automatique " + (int)CustomerService.AUTO_DISCOUNT_RATE + "% (total > " + CustomerService.AUTO_DISCOUNT_THRESHOLD.toPlainString() + "€)");
            logger.info("Remise automatique 5% appliquée : -{}€", autoDiscount);
        }

        // 6. Application de la remise (plafonnée au sous-total)
        BigDecimal discount = order.getDiscountAmount() != null
                ? order.getDiscountAmount()
                : BigDecimal.ZERO;
        if (discount.compareTo(subtotal) > 0) discount = subtotal;
        order.setDiscountAmount(discount);

        BigDecimal finalTotal = subtotal.subtract(discount);
        order.setTotalAmount(finalTotal);

        logger.info("Commande {} : sous-total {}€, remise {}€ ({}), total {}€",
                order.getId(), subtotal, discount, order.getDiscountReason(), finalTotal);

        // 7. Persistance
        Order saved = orderRepository.save(order);

        // 8. Fidélité
        if (order.getCustomerId() != null && !order.getCustomerId().isEmpty()) {
            try {
                customerService.addLoyaltyPoints(order.getCustomerId(), finalTotal);
            } catch (Exception e) {
                logger.warn("Impossible de créditer les points fidélité (client {}): {}",
                        order.getCustomerId(), e.getMessage());
            }
        }

        return saved;
    }
}
