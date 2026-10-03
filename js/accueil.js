import { listerArticles } from "./api.js";

export async function initialiserAccueil() {
    const zoneArticles = document.querySelector("#zone-articles");

    try {
        const articles = await listerArticles();
        afficherArticles(zoneArticles, articles);
    } catch (erreur) {
        zoneArticles.innerHTML = `<p class="message message-erreur">${erreur.message}</p>`;
    }
}

function afficherArticles(zoneArticles, articles) {
    if (!articles || articles.length === 0) {
        zoneArticles.innerHTML = `<p class="chargement">Aucun article pour le moment.</p>`;
        return;
    }

    const grille = document.createElement("div");
    grille.className = "grille-articles";

    for (const article of articles) {
        grille.appendChild(creerCarteArticle(article));
    }

    zoneArticles.innerHTML = "";
    zoneArticles.appendChild(grille);
}

const IMAGE_INDISPONIBLE =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
            <rect width="400" height="300" fill="#D8D3C7"/>
            <text x="200" y="155" font-family="sans-serif" font-size="18" fill="#55564F" text-anchor="middle">Image indisponible</text>
        </svg>`
    );

function creerCarteArticle(article) {
    const donnees = normaliserArticle(article);

    const carte = document.createElement("a");
    carte.className = "carte-article";
    carte.href = `detail.html?id=${donnees.id}`;

    carte.innerHTML = `
        <img class="carte-article-image" src="${donnees.image}" alt="${donnees.titre}" loading="lazy">
        <div class="carte-article-corps">
            <h3 class="carte-article-titre">${donnees.titre}</h3>
            <span class="carte-article-prix">${donnees.prix} €</span>
            <span class="carte-article-likes">♥ ${donnees.nombreLikes}</span>
        </div>
    `;

    // Certains sites (ex: bmw.fr) bloquent l'affichage de leurs images
    // depuis d'autres domaines : on prévoit un visuel de secours plutôt
    // qu'un carré vide avec l'icône d'image cassée du navigateur.
    const image = carte.querySelector("img");
    image.addEventListener(
        "error",
        () => {
            image.src = IMAGE_INDISPONIBLE;
        },
        { once: true }
    );

    return carte;
}

/**
 * Adapte un objet article renvoyé par l'API vers des noms de champs
 * pratiques à utiliser dans le HTML généré.
 * Noms confirmés via GET /api/stuff : _id, title, description, imageUrl, price, likes, usersLiked, userId.
 */
function normaliserArticle(article) {
    return {
        id: article._id,
        titre: article.title,
        prix: article.price,
        image: article.imageUrl,
        nombreLikes: article.likes,
    };
}
