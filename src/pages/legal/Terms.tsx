import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-28 pb-16 flex-1">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Conditions Générales d'Utilisation
              </h1>
              <p className="text-lg text-muted-foreground">
                Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>1. Objet et Champ d'Application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les conditions et modalités d'utilisation de la plateforme CBD Flower Cup (ci-après "la Plateforme"), ainsi que les droits et obligations des parties dans ce cadre.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  La Plateforme est un service de gestion et d'organisation de concours de fleurs CBD conforme à la réglementation européenne, développée et maintenue par l'association Gard Eau Arbres.
                </p>
                <p className="text-muted-foreground leading-relaxed font-semibold">
                  En accédant et en utilisant la Plateforme, vous reconnaissez avoir lu, compris et accepté sans réserve les présentes CGU.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>2. Conditions d'Accès</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">2.1. Âge Légal</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    L'accès à la Plateforme est réservé aux personnes majeures (18 ans minimum en France, 21 ans dans certains pays). En accédant à la Plateforme, vous certifiez être majeur selon la législation de votre pays de résidence.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.2. Conformité Réglementaire</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    La Plateforme est destinée exclusivement aux produits CBD conformes à la réglementation européenne (THC ≤ 0,3%). L'utilisation de la Plateforme pour des produits non conformes est strictement interdite.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.3. Géolocalisation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    L'accès à certaines fonctionnalités peut être restreint selon votre localisation géographique, en fonction des réglementations locales applicables.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>3. Compte Utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">3.1. Création de Compte</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Pour utiliser certaines fonctionnalités de la Plateforme, vous devez créer un compte en fournissant des informations exactes, complètes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3.2. Rôles et Responsabilités</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    La Plateforme propose différents rôles (Organisateur, Producteur, Juge, Spectateur) avec des permissions spécifiques. Vous êtes responsable de toutes les actions effectuées sous votre compte.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3.3. Suspension et Suppression</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Nous nous réservons le droit de suspendre ou supprimer tout compte en cas de non-respect des présentes CGU, d'utilisation frauduleuse, ou de comportement contraire à l'éthique de la Plateforme.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>4. Utilisation de la Plateforme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">4.1. Utilisation Autorisée</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    La Plateforme est destinée à des fins légales uniquement : organisation de concours, soumission d'entrées, évaluation par des juges experts, et vote public dans le respect des règles établies.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">4.2. Utilisations Interdites</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Utilisation de la Plateforme à des fins illégales ou non autorisées</li>
                    <li>Tentative de manipulation des votes, scores ou résultats</li>
                    <li>Usurpation d'identité ou création de faux comptes</li>
                    <li>Upload de contenus diffamatoires, offensants ou illégaux</li>
                    <li>Tentative d'accès non autorisé aux systèmes ou données</li>
                    <li>Utilisation de robots, scripts automatisés ou méthodes frauduleuses</li>
                    <li>Violation des droits de propriété intellectuelle</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>5. Propriété Intellectuelle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  La Plateforme et tous ses éléments (design, code, logos, textes, images) sont la propriété exclusive de Gard Eau Arbres ou de ses partenaires et sont protégés par les lois françaises et européennes sur la propriété intellectuelle.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Les contenus que vous soumettez (photos, descriptions, COA) restent votre propriété. En les soumettant, vous accordez à Gard Eau Arbres une licence non exclusive, gratuite et mondiale pour les utiliser dans le cadre de la Plateforme et de sa promotion.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>6. Protection des Données Personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Le traitement de vos données personnelles est effectué conformément au Règlement Général sur la Protection des Données (RGPD) et à notre Politique de Confidentialité, accessible à tout moment sur la Plateforme.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Vous disposez d'un droit d'accès, de rectification, de suppression, de limitation du traitement, de portabilité et d'opposition concernant vos données personnelles.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>7. Responsabilité et Garanties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">7.1. Disponibilité du Service</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Nous nous efforçons d'assurer la disponibilité de la Plateforme 24/7, mais ne pouvons garantir une disponibilité ininterrompue. Nous déclinons toute responsabilité en cas d'indisponibilité temporaire ou définitive.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">7.2. Contenu Utilisateur</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Gard Eau Arbres n'exerce pas de contrôle a priori sur les contenus soumis par les utilisateurs et décline toute responsabilité quant à leur exactitude, leur légalité ou leur conformité réglementaire. Chaque utilisateur est seul responsable du contenu qu'il publie.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">7.3. Limitation de Responsabilité</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Dans les limites autorisées par la loi, Gard Eau Arbres ne pourra être tenue responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la Plateforme.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>8. Modifications des CGU</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Gard Eau Arbres se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur la Plateforme. Il est recommandé de consulter régulièrement cette page.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  En cas de modification substantielle, les utilisateurs seront informés par email ou via une notification sur la Plateforme. La poursuite de l'utilisation de la Plateforme après modification vaut acceptation des nouvelles CGU.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>9. Droit Applicable et Juridiction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Les présentes CGU sont régies par le droit français. En cas de litige et à défaut d'accord amiable, les tribunaux français seront seuls compétents.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>10. Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question concernant les présentes CGU, vous pouvez nous contacter via la page de contact de la Plateforme ou par email à l'adresse indiquée dans nos informations légales.
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

export default Terms;

