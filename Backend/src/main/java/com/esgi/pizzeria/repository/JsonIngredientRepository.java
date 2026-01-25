package com.esgi.pizzeria.repository;

import com.esgi.pizzeria.domain.Ingredient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class JsonIngredientRepository {

    private static final Logger logger = LoggerFactory.getLogger(JsonIngredientRepository.class);
    private static final String FILE_PATH = "Backend/data/ingredients.json";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // CORRECTION : Ajout de 'final'
    private final List<Ingredient> database = Collections.synchronizedList(new ArrayList<>());

    @PostConstruct
    public void init() {
        File file = new File(FILE_PATH);
        if (file.exists()) {
            try {
                List<Ingredient> loaded = objectMapper.readValue(file, new TypeReference<List<Ingredient>>() {});
                database.clear();
                database.addAll(loaded);
                logger.info("{} ingrédients chargés.", database.size());
            } catch (IOException e) {
                logger.error("Fichier ingrédients corrompu ou illisible.", e);
            }
        }

        if (database.isEmpty()) {
            seedData();
        }
    }

    private void seedData() {
        logger.info("Base vide. Initialisation depuis initial-ingredients.json...");
        try (InputStream inputStream = getClass().getResourceAsStream("/initial-ingredients.json")) {
            if (inputStream != null) {
                List<Ingredient> seeds = objectMapper.readValue(inputStream, new TypeReference<List<Ingredient>>() {});
                database.addAll(seeds);
                saveToFile();
                logger.info("Seed réussi : {} ingrédients ajoutés.", seeds.size());
            } else {
                logger.warn("Fichier /initial-ingredients.json introuvable dans le classpath !");
            }
        } catch (IOException e) {
            logger.error("Erreur lors du seeding des ingrédients", e);
        }
    }

    private synchronized void saveToFile() {
        try {
            File file = new File(FILE_PATH);
            if (file.getParentFile() != null) file.getParentFile().mkdirs();
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, database);
        } catch (IOException e) {
            logger.error("Erreur d'écriture disque (Ingrédients)", e);
        }
    }

    public List<Ingredient> findAll() {
        return new ArrayList<>(database);
    }

    public Optional<Ingredient> findById(String id) {
        synchronized (database) {
            return database.stream().filter(i -> i.getId().equals(id)).findFirst();
        }
    }

    public synchronized Ingredient save(Ingredient ingredient) {
        database.removeIf(i -> i.getId().equals(ingredient.getId()));
        database.add(ingredient);
        saveToFile();
        return ingredient;
    }

    public synchronized void deleteById(String id) {
        boolean removed = database.removeIf(i -> i.getId().equals(id));
        if (removed) {
            saveToFile();
        }
    }
}