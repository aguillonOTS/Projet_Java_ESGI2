package com.esgi.pizzeria.domain;

import java.util.HashMap;
import java.util.Map;

/**
 * Employé utilisant le système de caisse.
 */
public class Salesperson {
    private String id;
    private String firstName;
    private String lastName;
    private String role; // "ADMIN" ou "SERVER"
    
    /**
     * SÉCURITÉ : Code PIN d'accès. 
     * Dans un système réel, ce code ne doit pas transiter en clair et doit être haché.
     */
    private String pinCode;
    
    private boolean isActive = true;
    private Map<String, Boolean> permissions = new HashMap<>();

    public Salesperson() {}

    public Salesperson(String id, String firstName, String lastName, String role, String pinCode) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.pinCode = pinCode;
        this.isActive = true;
    }

    // --- GETTERS & SETTERS ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public Map<String, Boolean> getPermissions() { return permissions; }
    public void setPermissions(Map<String, Boolean> permissions) { this.permissions = permissions; }
}