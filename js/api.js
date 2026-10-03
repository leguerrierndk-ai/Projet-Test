// api.js — point d'entrée unique vers l'API.
// Toutes les pages passent par les fonctions exportées ici :
// aucune autre partie du code n'appelle fetch() directement vers l'API.

const URL_BASE = "https://api-nest-js-six.vercel.app";

/**
 * Fonction interne : exécute une requête vers l'API.
 * - N'ajoute le token QUE si options.avecAuth vaut true (voir chaque fonction
 *   exportée plus bas). Important : l'envoyer sur une route publique comme
 *   GET /api/stuff déclenche une requête de préflight CORS que l'API ne gère
 *   pas, et bloque tout avec une erreur réseau "(null)".
 * - Ajoute automatiquement Content-Type: application/json s'il y a un corps.
 * - Vérifie systématiquement response.ok.
 * - Si la réponse est 401 (token expiré/invalide) : vide la session et
 *   redirige vers la connexion, comme demandé dans le cahier des charges.
 * - En cas d'erreur, lève une exception avec un message lisible
 *   (jamais de "undefined" ou de stack trace affiché à l'utilisateur).
 */
async function requeteApi(chemin, options = {}) {
    const entetes = {};
    if (options.body) {
        entetes["Content-Type"] = "application/json";
    }
    if (options.avecAuth) {
        const token = localStorage.getItem("token");
        if (token) {
            entetes["Authorization"] = `Bearer ${token}`;
        }
    }

    let reponse;
    try {
        reponse = await fetch(URL_BASE + chemin, {
            method: options.method || "GET",
            headers: entetes,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
    } catch (erreurReseau) {
        // Le serveur est injoignable (pas de connexion, API down...)
        throw new Error("Impossible de contacter le serveur. Vérifie ta connexion et réessaie.");
    }

    if (reponse.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.href = "connexion.html?raison=session-expiree";
        // On bloque l'exécution : la redirection est en cours.
        throw new Error("Session expirée.");
    }

    if (!reponse.ok) {
        let messageErreur = "Une erreur est survenue. Réessaie plus tard.";
        try {
            const corpsErreur = await reponse.json();
            if (corpsErreur && corpsErreur.message) {
                messageErreur = corpsErreur.message;
            }
        } catch {
            // Le corps de la réponse n'était pas du JSON exploitable : on garde le message par défaut.
        }
        throw new Error(messageErreur);
    }

    // Certaines routes (ex: DELETE) ne renvoient pas de corps JSON.
    const texte = await reponse.text();
    return texte ? JSON.parse(texte) : null;
}

/* ===== Authentification ===== */

export function inscrire(email, motDePasse) {
    return requeteApi("/api/auth/signup", {
        method: "POST",
        body: { email, password: motDePasse },
    });
}

export function connecter(email, motDePasse) {
    return requeteApi("/api/auth/login", {
        method: "POST",
        body: { email, password: motDePasse },
    });
}

/* ===== Articles ===== */

export function listerArticles() {
    return requeteApi("/api/stuff");
}

export function obtenirArticle(id) {
    return requeteApi(`/api/stuff/${id}`);
}

export function creerArticle(donneesArticle) {
    return requeteApi("/api/stuff", {
        method: "POST",
        body: donneesArticle,
        avecAuth: true,
    });
}

export function modifierArticle(id, donneesArticle) {
    return requeteApi(`/api/stuff/${id}`, {
        method: "PUT",
        body: donneesArticle,
        avecAuth: true,
    });
}

export function supprimerArticle(id) {
    return requeteApi(`/api/stuff/${id}`, {
        method: "DELETE",
        avecAuth: true,
    });
}

export function likerArticle(id) {
    return requeteApi(`/api/stuff/${id}/like`, {
        method: "POST",
        avecAuth: true,
    });
}

/* ===== Avis ===== */

export function obtenirAvis(idArticle) {
    return requeteApi(`/api/stuff/avis/${idArticle}`);
}

export function posterAvis(donneesAvis) {
    return requeteApi("/api/stuff/avis", {
        method: "POST",
        body: donneesAvis,
        avecAuth: true,
    });
}

/* ===== Aides pour les pages ===== */

export function estConnecte() {
    return Boolean(localStorage.getItem("token"));
}

export function estProprietaire(article) {
    return localStorage.getItem("userId") === article.userId;
}
