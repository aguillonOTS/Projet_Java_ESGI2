package com.esgi.pizzeria.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.esgi.pizzeria.domain.Ingredient;
import com.esgi.pizzeria.repository.JsonIngredientRepository;

/**
 * Contrôleur REST gérant les opérations CRUD sur les ingrédients.
 * <p>
 * Ce contrôleur expose les points de terminaison pour lister, ajouter, modifier
 * et supprimer les ingrédients disponibles pour les pizzas.
 * Il interagit directement avec le repository JSON (Architecture simplifiée).
 * </p>
 */
@RestController
@RequestMapping("/api/ingredients")
// NOTE: @CrossOrigin retiré ici car géré globalement dans CorsConfig.java (Principe DRY)
public class IngredientController {

    private final JsonIngredientRepository repository;

    /**
     * Injection de dépendance par constructeur.
     * <p>Choix de conception : Favorise l'immutabilité et facilite les tests unitaires
     * en permettant de passer un mock du repository.</p>
     *
     * @param repository Le dépôt de données (JSON) pour les ingrédients.
     */
    public IngredientController(JsonIngredientRepository repository) {
        this.repository = repository;
    }

    /**
     * Récupère la liste complète des ingrédients.
     *
     * @return Une réponse HTTP 200 contenant la liste des ingrédients.
     */
    @GetMapping
    public ResponseEntity<List<Ingredient>> getAll() {
        List<Ingredient> ingredients = repository.findAll();
        return ResponseEntity.ok(ingredients);
    }

    /**
     * Crée ou met à jour un ingrédient.
     * <p>
     * SÉCURITÉ : L'utilisation de @RequestBody convertit le JSON entrant en objet Java.
     * Il est fortement recommandé d'ajouter l'annotation @Valid (de Bean Validation)
     * devant le paramètre pour garantir l'intégrité des données avant le traitement.
     * </p>
     *
     * @param ingredient L'objet ingrédient reçu dans le corps de la requête.
     * @return Une réponse HTTP 200 (ou 201) avec l'ingrédient sauvegardé.
     */
    @PostMapping
    public ResponseEntity<Ingredient> save(@RequestBody Ingredient ingredient) {
        // Validation basique (Idéalement, utiliser @Valid et BindingResult)
        if (ingredient == null) {
            return ResponseEntity.badRequest().build();
        }

        // Gère à la fois la Création et la Modification (Upsert)
        Ingredient savedIngredient = repository.save(ingredient);
        
        // Retourne 200 OK. Pour une création stricte, 201 Created serait préférable.
        return ResponseEntity.status(HttpStatus.OK).body(savedIngredient);
    }

    /**
     * Supprime un ingrédient par son identifiant unique.
     *
     * @param id L'identifiant de l'ingrédient à supprimer.
     * @return Une réponse HTTP 204 (No Content) indiquant le succès de l'opération sans contenu retourné.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        // SÉCURITÉ : Vérification basique de l'entrée (non null/vide géré par Spring MVC)
        repository.deleteById(id);
        
        // Standard REST : Retourne 204 No Content après une suppression réussie
        return ResponseEntity.noContent().build();
    }
}