package com.esgi.pizzeria.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.esgi.pizzeria.domain.Customer;
import com.esgi.pizzeria.repository.JsonCustomerRepository;

/**
 * Service métier pour la gestion des clients et du programme de fidélité.
 *
 * RÈGLES DE FIDÉLITÉ :
 * - 1 point par euro dépensé (montant final après remise, tronqué à l'entier)
 * - 100 points = 5€ de réduction (cashback effectif ~5%)
 * - Les points se consomment par tranches de 100
 */
@Service
public class CustomerService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    // Constantes publiques — source de vérité unique pour toute la logique de fidélité
    public static final int    POINTS_PER_EURO            = 1;
    public static final int    POINTS_PER_REDEMPTION      = 100;
    public static final BigDecimal DISCOUNT_PER_REDEMPTION = new BigDecimal("5.00");
    public static final double AUTO_DISCOUNT_RATE          = 5.0;
    public static final BigDecimal AUTO_DISCOUNT_THRESHOLD = new BigDecimal("20.00");

    private final JsonCustomerRepository repository;

    public CustomerService(JsonCustomerRepository repository) {
        this.repository = repository;
    }

    public List<Customer> findAll() {
        return repository.findAll();
    }

    public Optional<Customer> findById(String id) {
        return repository.findById(id);
    }

    public Optional<Customer> findByPhone(String phone) {
        return repository.findByPhone(phone);
    }

    public Customer save(Customer customer) {
        if (customer.getId() == null || customer.getId().isEmpty()) {
            customer.setId(UUID.randomUUID().toString());
            logger.info("Nouveau client créé : {} ({})", customer.getName(), customer.getPhone());
        } else {
            logger.info("Client mis à jour : {} ({})", customer.getName(), customer.getPhone());
        }
        return repository.save(customer);
    }

    public void delete(String id) {
        repository.deleteById(id);
        logger.info("Client supprimé : {}", id);
    }

    /**
     * Ajoute des points de fidélité basés sur le montant de la commande.
     * Règle : 1 point par euro dépensé (tronqué).
     *
     * @param customerId ID du client
     * @param orderTotal Montant final de la commande (après remise)
     * @return Le client mis à jour
     */
    public Customer addLoyaltyPoints(String customerId, BigDecimal orderTotal) {
        Customer customer = repository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Client introuvable : " + customerId));

        int pointsEarned = orderTotal.intValue() * POINTS_PER_EURO;
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() + pointsEarned);
        repository.save(customer);

        logger.info("Client {} : +{} points (total: {})", customer.getName(), pointsEarned, customer.getLoyaltyPoints());
        return customer;
    }

    /**
     * Utilise des points de fidélité et retourne le montant de la remise.
     * Règle : 100 points = 5€ de réduction.
     *
     * @param customerId    ID du client
     * @param pointsToRedeem Nombre de points à utiliser (doit être un multiple de 100)
     * @return Le montant de la remise en euros
     */
    public BigDecimal redeemPoints(String customerId, int pointsToRedeem) {
        if (pointsToRedeem <= 0) {
            throw new IllegalArgumentException("Le nombre de points doit être positif.");
        }
        if (pointsToRedeem % POINTS_PER_REDEMPTION != 0) {
            throw new IllegalArgumentException("Les points se consomment par tranches de " + POINTS_PER_REDEMPTION + ".");
        }

        Customer customer = repository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Client introuvable : " + customerId));

        if (customer.getLoyaltyPoints() < pointsToRedeem) {
            throw new IllegalArgumentException("Points insuffisants (disponible: " + customer.getLoyaltyPoints() + ").");
        }

        customer.setLoyaltyPoints(customer.getLoyaltyPoints() - pointsToRedeem);
        repository.save(customer);

        int redemptions = pointsToRedeem / POINTS_PER_REDEMPTION;
        BigDecimal discount = DISCOUNT_PER_REDEMPTION.multiply(BigDecimal.valueOf(redemptions));

        logger.info("Client {} : -{} points utilisés, remise de {}€", customer.getName(), pointsToRedeem, discount);
        return discount;
    }
}
