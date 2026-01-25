package com.esgi.pizzeria.domain;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Représente une commande client complète.
 */
public class Order {
    
    private String id;
    
    // ROBUSTESSE : BigDecimal pour les calculs financiers.
    private BigDecimal totalAmount;
    
    private String salespersonId;
    private int tableNumber;
    private String paymentMethod;
    
    // CONSEIL : Utiliser LocalDateTime en interne et formater en String uniquement pour le JSON.
    // Pour l'instant, on garde String pour compatibilité avec votre JSON existant.
    private String date; 
    
    // Initialisation pour éviter null
    private List<OrderLine> items = new ArrayList<>();

    public Order() {
        this.id = UUID.randomUUID().toString();
    }

    // --- GETTERS & SETTERS ---
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getSalespersonId() { return salespersonId; }
    public void setSalespersonId(String salespersonId) { this.salespersonId = salespersonId; }

    public int getTableNumber() { return tableNumber; }
    public void setTableNumber(int tableNumber) { this.tableNumber = tableNumber; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<OrderLine> getItems() { return items; }
    public void setItems(List<OrderLine> items) { this.items = items; }
}