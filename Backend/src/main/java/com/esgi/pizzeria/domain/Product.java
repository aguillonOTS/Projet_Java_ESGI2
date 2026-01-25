package com.esgi.pizzeria.domain;

import java.math.BigDecimal;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Classe de base abstraite représentant tout article vendable (Pizza, Boisson, etc.).
 * <p>
 * CONCEPTION : Utilisation de @JsonTypeInfo pour gérer le polymorphisme lors de la
 * désérialisation JSON. Le champ "type" permet à Jackson de savoir s'il faut
 * instancier un Dish ou un Drink.
 * </p>
 */
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = Dish.class, name = "DISH"),
    @JsonSubTypes.Type(value = Drink.class, name = "DRINK")
})
public abstract class Product {

    private String id;
    private String name;
    
    /**
     * Prix unitaire.
     * Utilisation de BigDecimal obligatoire pour la précision monétaire.
     */
    private BigDecimal price;
    
    private ProductStatus status;
    private BigDecimal vat; // Taux de TVA (Value Added Tax)

    public Product() {
        // Constructeur vide requis par Jackson
    }

    public Product(String name, BigDecimal price) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.price = price;
        this.status = ProductStatus.DRAFT; // Par défaut, un produit est brouillon
    }

    // --- GETTERS & SETTERS ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }

    public BigDecimal getVat() { return vat; }
    public void setVat(BigDecimal vat) { this.vat = vat; }
}