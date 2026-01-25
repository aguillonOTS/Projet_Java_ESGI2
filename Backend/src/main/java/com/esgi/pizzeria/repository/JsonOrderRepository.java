package com.esgi.pizzeria.repository;

import com.esgi.pizzeria.domain.Order;
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
import java.util.List;
import java.util.Optional;

@Repository
public class JsonOrderRepository {

    private static final Logger logger = LoggerFactory.getLogger(JsonOrderRepository.class);
    private static final String FILE_PATH = "Backend/data/orders.json";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // CORRECTION : Ajout de 'final'
    private final List<Order> database = Collections.synchronizedList(new ArrayList<>());

    @PostConstruct
    public void init() {
        File file = new File(FILE_PATH);
        if (file.exists()) {
            try {
                List<Order> loaded = objectMapper.readValue(file, new TypeReference<List<Order>>() {});
                database.clear();
                database.addAll(loaded);
                logger.info("{} commandes chargées en mémoire.", database.size());
            } catch (IOException e) {
                logger.error("Erreur lecture commandes", e);
            }
        } else {
            saveToFile();
        }
    }

    private synchronized void saveToFile() {
        try {
            File file = new File(FILE_PATH);
            if (file.getParentFile() != null) file.getParentFile().mkdirs();
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, database);
        } catch (IOException e) {
            logger.error("CRITIQUE : Impossible de sauvegarder la commande !", e);
        }
    }

    public List<Order> findAll() {
        return new ArrayList<>(database);
    }

    public Optional<Order> findById(String id) {
        synchronized (database) {
            return database.stream()
                    .filter(o -> o.getId().equals(id))
                    .findFirst();
        }
    }

    public synchronized Order save(Order order) {
        database.removeIf(o -> o.getId().equals(order.getId()));
        database.add(order);
        saveToFile();
        return order;
    }
}