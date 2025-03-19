export enum ErrorEnum {
    MISSING_REQUIRED_FIELDS = 'Certains champs requis sont manquant',
    EMAIL_ALREADY_USED = 'Email déjà utilisé',
    INVALID_EMAIL = 'Adresse email invalide',
    ACCOUNT_NOT_FOUND = "Compte non trouvé",
    PASSWORD_INVALID = "Mot de passe invalide",
    INVALID_TOKEN = "Token invalide",
    MISSING_TOKEN = "Token manquant",
    INVALID_SIGNATURE_OR_INCORRECT_TOKEN = "Signature invalide ou jeton incorrect",
    PLEASE_AUTHENTICATE = "Veuillez vous authentifier",
    UNEXPECTED_ERROR = "Une exception non géré s'est produite",
    UNAUTHORIZED_MIME_TYPE = "Type de fichier non autorisé",
    BDD_ERROR = "Erreur de base de données",
    UPDATE_EMPTY = "Les données de mise à jour sont requises.",
    NOT_FOUND = "Non trouvé",
    UNAUTHORIZED = "Non autorisé",
    FORBIDDEN = "Interdit",
    INTERNAL_SERVER_ERROR = "Erreur interne du serveur",
    BAD_REQUEST = "Mauvaise requête",
    ID_INVALID = "ID de mission invalide.",
    FILE_DELETE_ERROR = "Erreur lors de la suppression du fichier"
  }
  