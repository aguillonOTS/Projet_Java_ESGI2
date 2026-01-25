package com.esgi.pizzeria.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.esgi.pizzeria.domain.Order;
import com.esgi.pizzeria.repository.JsonOrderRepository;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final JsonOrderRepository orderRepository;

    public OrderController(JsonOrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        // On fixe la date côté serveur pour être sûr
        // (Assurez-vous que votre classe Order a un champ String ou LocalDateTime pour la date)
        // Ici on sauvegarde juste tel quel pour l'exemple
        return orderRepository.save(order);
    }
}