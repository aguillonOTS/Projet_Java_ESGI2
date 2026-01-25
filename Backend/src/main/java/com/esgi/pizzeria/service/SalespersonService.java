package com.esgi.pizzeria.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service; // Import de notre utilitaire

import com.esgi.pizzeria.domain.Salesperson;
import com.esgi.pizzeria.repository.JsonSalespersonRepository;
import com.esgi.pizzeria.util.SecurityUtils;

/**
 * Service métier gérant les vendeurs et l'authentification.
 * <p>
 * Ce service agit comme une couche de protection devant le Repository.
 * Il assure que :
 * 1. Aucun mot de passe ne soit stocké en clair.
 * 2. La vérification des identifiants se fasse de manière sécurisée (comparaison de hashs).
 * </p>
 */
@Service
public class SalespersonService {

    private final JsonSalespersonRepository repository;

    /**
     * Injection du repository par constructeur.
     * @param repository L'accès aux données persistées.
     */
    public SalespersonService(JsonSalespersonRepository repository) {
        this.repository = repository;
    }

    /**
     * Récupère la liste de tous les employés.
     * @return Liste des vendeurs.
     */
    public List<Salesperson> findAll() {
        return repository.findAll();
    }

    /**
     * Sauvegarde un vendeur en sécurisant ses données sensibles.
     * <p>
     * RÈGLE MÉTIER :
     * Avant de sauvegarder, on vérifie si le PIN est déjà haché.
     * Si sa longueur est inférieure à 64 caractères (taille d'un hash SHA-256),
     * on considère qu'il est en clair et on le hache.
     * </p>
     *
     * @param salesperson Le vendeur à créer ou mettre à jour.
     * @return Le vendeur sauvegardé avec son PIN haché.
     */
    public Salesperson save(Salesperson salesperson) {
        String rawPin = salesperson.getPinCode();
        
        // Vérification défensive : Ne pas re-hacher un hash existant
        if (rawPin != null && rawPin.length() < 64) {
            String hashedPin = SecurityUtils.hashPassword(rawPin);
            salesperson.setPinCode(hashedPin);
        }
        
        return repository.save(salesperson);
    }

    /**
     * Supprime un vendeur par son ID.
     * @param id L'identifiant du vendeur.
     */
    public void delete(String id) {
        repository.deleteById(id);
    }

    /**
     * Vérifie la validité d'un code PIN pour un utilisateur donné.
     * <p>
     * PROCÉDURE DE SÉCURITÉ :
     * 1. On récupère l'utilisateur en base (qui contient le vrai hash).
     * 2. On hache le PIN proposé par l'utilisateur (rawPin).
     * 3. On compare les deux hashs.
     * On ne déchiffre jamais le mot de passe stocké (c'est impossible avec un hash).
     * </p>
     *
     * @param id L'identifiant de l'utilisateur qui tente de se connecter.
     * @param rawPin Le code PIN saisi dans l'interface.
     * @return true si les hashs correspondent, false sinon.
     */
    public boolean verifyPin(String id, String rawPin) {
        Optional<Salesperson> userOpt = repository.findById(id);
        
        if (userOpt.isPresent()) {
            Salesperson user = userOpt.get();
            String hashedInput = SecurityUtils.hashPassword(rawPin);
            
            // Comparaison sécurisée des chaînes
            return user.getPinCode().equals(hashedInput);
        }
        
        return false; // Utilisateur non trouvé
    }
}