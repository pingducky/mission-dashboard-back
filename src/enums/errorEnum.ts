export enum ErrorEnum {
    MISSING_REQUIRED_FIELDS = 'Missing required fields',
    EMAIL_ALREADY_USED = 'Email déjà utilisé',
    INVALID_EMAIL = 'Adresse email invalide',
    ACCOUNT_NOT_FOUND = "Compte non trouvé",
    PASSWORD_INVALID = "Mot de passe invalide",
    INVALID_TOKEN = "Token invalide",
    MISSING_TOKEN = "Token manquant",
    INVALID_SIGNATURE_OR_INCORRECT_TOKEN = "Signature invalide ou jeton incorrect",
    PLEASE_AUTHENTICATE = "Veuillez vous authentifier",
    UNEXPECTED_ERROR = "Une exception non géré c'est produite",
    UNAUTHORIZED = "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
  }
  