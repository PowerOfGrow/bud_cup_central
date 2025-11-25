import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, FileText, Mail } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-28 pb-16 flex-1">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <Shield className="h-16 w-16 text-accent" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Politique de Confidentialité
              </h1>
              <p className="text-lg text-muted-foreground">
                Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  1. Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  L'association Gard Eau Arbres (ci-après "nous", "notre") accorde une importance primordiale à la protection de vos données personnelles. Cette Politique de Confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) de l'Union Européenne.
                </p>
                <p className="text-muted-foreground leading-relaxed font-semibold">
                  En utilisant la plateforme CBD Flower Cup, vous acceptez les pratiques décrites dans cette politique.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  2. Données Collectées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">2.1. Données d'Identification</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Nom et prénom (si fourni)</li>
                    <li>Adresse email</li>
                    <li>Nom d'affichage public</li>
                    <li>Organisation (si applicable)</li>
                    <li>Rôle sur la plateforme (Organisateur, Producteur, Juge, Spectateur)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.2. Données de Navigation</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Adresse IP</li>
                    <li>Type de navigateur et version</li>
                    <li>Pages visitées et durée de visite</li>
                    <li>Cookies et technologies similaires</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.3. Données de Contenu</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Photos de produits soumises</li>
                    <li>Descriptions et informations produits</li>
                    <li>Certificats d'Analyse (COA) uploadés</li>
                    <li>Évaluations et commentaires</li>
                    <li>Votes publics</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  3. Utilisation des Données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Nous utilisons vos données personnelles aux fins suivantes :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Gestion de compte :</strong> Création, authentification et gestion de votre compte utilisateur</li>
                  <li><strong>Fonctionnalités de la plateforme :</strong> Organisation de concours, soumission d'entrées, évaluation par juges, votes publics</li>
                  <li><strong>Communication :</strong> Envoi de notifications importantes, réponses à vos demandes</li>
                  <li><strong>Conformité réglementaire :</strong> Vérification de la conformité des produits (THC ≤ 0,3%), traçabilité</li>
                  <li><strong>Amélioration du service :</strong> Analyse statistique anonymisée pour améliorer l'expérience utilisateur</li>
                  <li><strong>Sécurité :</strong> Détection et prévention de fraudes, abus et activités illégales</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  4. Base Légale du Traitement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Le traitement de vos données personnelles est basé sur :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Consentement :</strong> Pour les communications marketing (si vous y avez consenti)</li>
                  <li><strong>Exécution d'un contrat :</strong> Pour la fourniture des services de la plateforme</li>
                  <li><strong>Obligation légale :</strong> Pour la conformité réglementaire et la traçabilité des produits CBD</li>
                  <li><strong>Intérêt légitime :</strong> Pour la sécurité, la prévention de fraudes et l'amélioration du service</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>5. Partage des Données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données avec :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Prestataires de services :</strong> Hébergeur (Supabase - Europe), service d'email (Resend), analytics (Vercel Analytics) - tous conformes RGPD</li>
                  <li><strong>Données publiques :</strong> Nom d'affichage, organisation, photos de produits soumises sont visibles par tous les utilisateurs de la plateforme</li>
                  <li><strong>Autorités légales :</strong> En cas d'obligation légale ou de demande judiciaire</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed font-semibold">
                  Tous nos prestataires sont situés en Europe ou certifiés conformes au RGPD (clauses contractuelles types).
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>6. Conservation des Données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Données de compte :</strong> Conservées jusqu'à suppression de votre compte</li>
                  <li><strong>Certificats d'Analyse (COA) :</strong> Conservés 5 à 10 ans selon réglementation européenne sur la traçabilité</li>
                  <li><strong>Résultats de concours :</strong> Conservés indéfiniment pour historique et transparence</li>
                  <li><strong>Données de navigation :</strong> Conservées 13 mois maximum (conformément à la CNIL)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>7. Vos Droits RGPD</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
                  <li><strong>Droit de rectification :</strong> Corriger des données inexactes ou incomplètes</li>
                  <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données (sous réserve des obligations légales de conservation)</li>
                  <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données</li>
                  <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données pour motifs légitimes</li>
                  <li><strong>Droit de retirer le consentement :</strong> À tout moment pour les traitements basés sur le consentement</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Pour exercer ces droits, contactez-nous via la page de contact ou via email. Nous répondrons dans un délai d'un mois.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>8. Sécurité des Données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Chiffrement SSL/TLS pour toutes les communications</li>
                  <li>Authentification forte (OAuth, email + mot de passe sécurisé)</li>
                  <li>Row Level Security (RLS) au niveau base de données</li>
                  <li>Sauvegardes régulières et sécurisées</li>
                  <li>Hébergement en Europe (conformité RGPD)</li>
                  <li>Accès restreint aux données personnelles (principe du moindre privilège)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>9. Cookies et Technologies Similaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Nous utilisons des cookies et technologies similaires pour :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Authentification et session utilisateur (cookies essentiels)</li>
                  <li>Analytics anonymisées (analyse du trafic)</li>
                  <li>Préférences utilisateur (thème, langue)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Pour plus d'informations, consultez notre <a href="/legal/cookies" className="text-accent hover:underline">Politique des Cookies</a>.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  10. Contact et Réclamations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question concernant cette politique ou pour exercer vos droits, contactez-nous via la page de contact de la plateforme.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Vous avez également le droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>CNIL</strong><br />
                  3 Place de Fontenoy - TSA 80715<br />
                  75334 PARIS CEDEX 07<br />
                  Tél : 01 53 73 22 22<br />
                  Site web : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.cnil.fr</a>
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>11. Modifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Cette politique peut être modifiée à tout moment. Les modifications entrent en vigueur dès leur publication sur cette page. Nous vous recommandons de consulter régulièrement cette politique pour rester informé de la façon dont nous protégeons vos données.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;

