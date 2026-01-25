package com.esgi.pizzeria.domain;

import java.util.UUID;

/**
 * Client de la pizzeria (pour la fidélité et la livraison).
 */
public class Customer {
    private String id;
    private String name;
    private String phone;
    private String address;
    private String city;
    private int loyaltyPoints;

    public Customer() {}

    public Customer(String name, String phone, String address, String city) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.loyaltyPoints = 0;
    }

    // --- GETTERS & SETTERS ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public int getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(int loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }
}