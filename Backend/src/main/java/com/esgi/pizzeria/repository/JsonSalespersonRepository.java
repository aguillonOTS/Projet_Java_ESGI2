package com.esgi.pizzeria.repository;

import com.esgi.pizzeria.domain.Salesperson;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Repository gérant la persistance des vendeurs dans un fichier JSON.
 * <p>
 * Responsabilités :
 * - Lecture/Écriture atomique du fichier 'salesperson.json'.
 * - Initialisation des données par défaut (Seeding) si la base est vide.
 * </p>
 */
@Repository
public class JsonSalespersonRepository {

    private static final Logger logger = LoggerFactory.getLogger(JsonSalespersonRepository.class);
    private final String FILE_PATH = "Backend/data/salesperson.json";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Thread-Safety : Liste synchronisée pour gérer les accès concurrents
    private final List<Salesperson> database = Collections.synchronizedList(new ArrayList<>());

    /**
     * Chargement des données au démarrage de l'application.
     */
    @PostConstruct
    public void init() {
        File file = new File(FILE_PATH);
        if (file.exists()) {
            try {
                List<Salesperson> loaded = objectMapper.readValue(file, new TypeReference<List<Salesperson>>() {});
                database.clear();
                database.addAll(loaded);
                logger.info("{} vendeurs chargés.", database.size());
            } catch (IOException e) {
                logger.error("Erreur lecture fichier vendeurs", e);
            }
        }
        
        // Si aucun fichier ou fichier vide, on crée les comptes par défaut
        if (database.isEmpty()) {
            seedDefaultUsers();
        }
    }

    /**
     * Génère les utilisateurs initiaux avec des mots de passe HACHÉS.
     * <p>
     * NOTE IMPORTANTE :
     * On ne stocke jamais "1234" ou "0000" ici. On utilise leurs empreintes SHA-256 pré-calculées.
     * Cela garantit que même le fichier JSON ne contient pas de données exploitables en clair.
     * </p>
     */
    private void seedDefaultUsers() {
        logger.info("Initialisation de la base vendeurs (Admin/Staff)...");
        
        // 1. ADMIN (Pin original: "1234")
        // Hash SHA-256 : 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
        String hashAdmin = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";
        
        Salesperson admin = new Salesperson("admin-01", "Admin", "System", "ADMIN", hashAdmin);
        admin.setActive(true);
        Map<String, Boolean> adminPerms = new HashMap<>();
        adminPerms.put("manage_stock", true);
        adminPerms.put("manage_menu", true);
        adminPerms.put("manage_users", true);
        adminPerms.put("cash_out", true);
        admin.setPermissions(adminPerms);
        database.add(admin);

        // 2. MARIO - Serveur (Pin original: "0000")
        // Hash SHA-256 : 9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0
        String hashMario = "9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0";
        
        Salesperson mario = new Salesperson("staff-01", "Mario", "Rossi", "SERVER", hashMario);
        mario.setActive(true);
        Map<String, Boolean> serverPerms = new HashMap<>();
        serverPerms.put("manage_stock", false);
        serverPerms.put("manage_menu", false);
        serverPerms.put("manage_users", false);
        serverPerms.put("cash_out", true);
        mario.setPermissions(serverPerms);
        database.add(mario);

        saveToFile();
    }

    /**
     * Persiste la liste en mémoire vers le fichier JSON.
     * Méthode synchronisée pour éviter la corruption de fichier lors d'écritures concurrentes.
     */
    private synchronized void saveToFile() {
        try {
            File file = new File(FILE_PATH);
            if (file.getParentFile() != null) file.getParentFile().mkdirs();
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, database);
        } catch (IOException e) {
            logger.error("Erreur critique lors de la sauvegarde des vendeurs", e);
        }
    }

    public List<Salesperson> findAll() {
        // Retourne une copie pour éviter la modification directe de la liste synchronisée
        return new ArrayList<>(database);
    }

    public Optional<Salesperson> findById(String id) {
        synchronized (database) {
            return database.stream().filter(s -> s.getId().equals(id)).findFirst();
        }
    }

    public synchronized Salesperson save(Salesperson user) {
        database.removeIf(s -> s.getId().equals(user.getId()));
        database.add(user);
        saveToFile();
        return user;
    }

    public synchronized void deleteById(String id) {
        if (database.removeIf(s -> s.getId().equals(id))) {
            saveToFile();
        }
    }
}