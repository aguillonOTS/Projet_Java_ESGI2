package com.esgi.pizzeria.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.esgi.pizzeria.domain.Product;
import com.esgi.pizzeria.repository.JsonProductRepository;

/**
 * Service métier gérant le catalogue des produits.
 * <p>
 * Rôle : Assure la cohérence des données produits (prix positifs, noms renseignés)
 * avant leur inscription dans la base de données.
 * </p>
 */
@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);
    private final JsonProductRepository productRepository;

    public ProductService(JsonProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Retourne le catalogue complet.
     * @return Liste de tous les produits (Pizzas et Boissons).
     */
    public List<Product> findAll() {
        return productRepository.findAll();
    }

    /**
     * Crée ou met à jour un produit.
     * <p>
     * Applique des règles de validation strictes pour éviter la corruption de données.
     * </p>
     *
     * @param product Le produit à sauvegarder.
     * @return Le produit persisté.
     * @throws IllegalArgumentException si le prix est négatif ou le nom vide.
     */
    public Product save(Product product) {
        // VALIDATION 1 : Le nom est obligatoire
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom du produit est obligatoire.");
        }

        // VALIDATION 2 : Le prix ne peut pas être négatif
        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Le prix du produit doit être positif.");
        }

        // LOGIQUE MÉTIER : Génération d'ID pour les nouveaux produits
        boolean isNew = (product.getId() == null || product.getId().isEmpty());
        if (isNew) {
            product.setId(UUID.randomUUID().toString());
        }

        Product savedProduct = productRepository.save(product);
        
        if (isNew) {
            logger.info("Nouveau produit créé : {} ({})", savedProduct.getName(), savedProduct.getPrice());
        } else {
            logger.info("Produit mis à jour : {}", savedProduct.getId());
        }

        return savedProduct;
    }
}