package com.esgi.pizzeria.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utilitaire statique dédié aux opérations cryptographiques.
 * <p>
 * Cette classe fournit des méthodes pour sécuriser les données sensibles (mots de passe, PIN).
 * Elle isole la complexité des algorithmes de hachage du reste de l'application.
 * </p>
 */
public class SecurityUtils {

    /**
     * Hache une chaîne de caractères en utilisant l'algorithme SHA-256.
     * <p>
     * Le SHA-256 produit une empreinte unique de 64 caractères hexadécimaux.
     * C'est un standard robuste pour le stockage de mots de passe (bien que BCrypt soit préférable en production).
     * </p>
     *
     * @param rawPassword Le mot de passe ou code PIN en clair.
     * @return Le hash hexadécimal du mot de passe, ou null si l'entrée est null.
     * @throws RuntimeException Si l'algorithme SHA-256 n'est pas supporté par la JVM (cas très rare).
     */
    public static String hashPassword(String rawPassword) {
        if (rawPassword == null) return null;
        try {
            // Initialisation de l'algorithme de hachage standard Java
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            
            // Conversion en octets et hachage
            byte[] encodedhash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            
            // Conversion des octets bruts en chaîne hexadécimale lisible
            return bytesToHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            // Erreur critique : Si SHA-256 manque, la sécurité du système est compromise.
            throw new RuntimeException("Erreur critique : Algorithme SHA-256 introuvable", e);
        }
    }

    /**
     * Convertit un tableau d'octets en chaîne hexadécimale.
     * * @param hash Le tableau d'octets résultant du hachage.
     * @return La représentation String (ex: "a3f5...").
     */
    private static String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0'); // Padding pour avoir toujours 2 caractères
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}