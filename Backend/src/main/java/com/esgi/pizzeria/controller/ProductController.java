package com.esgi.pizzeria.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.esgi.pizzeria.domain.Product;
import com.esgi.pizzeria.repository.JsonProductRepository;

/**
 * Contrôleur REST pour la gestion du catalogue des produits (Pizzas, Boissons, etc.).
 * <p>
 * Ce contrôleur expose les opérations CRUD (Create, Read, Update, Delete) nécessaires
 * au panneau d'administration et à l'interface de commande.
 * </p>
 */
@RestController
@RequestMapping("/api/products")
// NOTE: @CrossOrigin retiré car la configuration est centralisée dans CorsConfig.java
public class ProductController {

    private final JsonProductRepository repository;

    /**
     * Constructeur avec injection de dépendance.
     * <p>
     * L'injection par constructeur rend la classe testable (facilité de mocker le repository)
     * et assure que le contrôleur ne peut exister sans sa dépendance obligatoire.
     * </p>
     *
     * @param repository Le mécanisme de persistance (JSON) des produits.
     */
    public ProductController(JsonProductRepository repository) {
        this.repository = repository;
    }

    /**
     * Récupère l'intégralité du catalogue de produits.
     *
     * @return Une liste de produits encapsulée dans une réponse HTTP 200 OK.
     */
    @GetMapping
    public ResponseEntity<List<Product>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    /**
     * Ajoute un nouveau produit ou met à jour un produit existant (Upsert).
     * <p>
     * SÉCURITÉ : Il est impératif de valider les données entrantes (prix positif, nom non vide).
     * Recommandation : Ajouter l'annotation @Valid sur le paramètre product.
     * </p>
     *
     * @param product Le produit désérialisé depuis le corps de la requête JSON.
     * @return Le produit sauvegardé avec un statut HTTP 200 OK.
     */
    @PostMapping
    public ResponseEntity<Product> save(@RequestBody Product product) {
        // Validation défensive basique
        if (product == null) {
            return ResponseEntity.badRequest().build();
        }

        Product savedProduct = repository.save(product);
        return ResponseEntity.ok(savedProduct);
    }

    /**
     * Supprime un produit du catalogue.
     *
     * @param id L'identifiant unique du produit à supprimer.
     * @return Une réponse HTTP 204 (No Content) confirmant la suppression.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        // ROBUSTESSE : Dans un cas réel, vérifier si l'ID existe avant de tenter la suppression
        // peut éviter des erreurs silencieuses, bien que deleteById soit souvent idempotent.
        repository.deleteById(id);
        
        // 204 No Content est le standard REST pour une suppression réussie sans retour de données.
        return ResponseEntity.noContent().build();
    }
}