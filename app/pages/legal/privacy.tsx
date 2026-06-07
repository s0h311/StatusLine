import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/legal/privacy')({
  component: LegalPrivacyPage,
})

function LegalPrivacyPage() {
  return (
    <div className='mx-auto w-full max-w-2xl px-4 py-8'>
      <h1>Datenschutzerklärung</h1>

      <p>
        Diese Datenschutzerklärung gilt für die Website <strong>StatusLine.Rock-Science.com</strong> einschließlich des
        Anmeldebereichs für Geschäfte.
      </p>

      <p>
        <strong>Hinweis zur Abgrenzung:</strong> Die Verarbeitung der Auftragsdaten von Endkunden (Name, E-Mail,
        Auftragsbeschreibung, Status) erfolgt ausschließlich im Auftrag und nach Weisung des jeweiligen Geschäfts.
        Insoweit handelt Rock Science als Auftragsverarbeiter nach Art. 28 DSGVO; Verantwortlicher ist das jeweilige
        Geschäft. Diese Verarbeitung ist nicht Gegenstand dieser Erklärung, sondern der Datenschutzerklärung auf der
        jeweiligen Auftragsverfolgungsseite sowie des Auftragsverarbeitungsvertrags.
      </p>

      <h2>1. Verantwortlicher</h2>

      <p>
        Rock Science (Inhaber: Soheil Nazari)
        <br />
        Oldachstr. 8
        <br />
        22307 Hamburg
        <br />
        E-Mail: hello@rock-science.com
        <br />
        Telefon: 0176 42946108
      </p>

      <p>Ein Datenschutzbeauftragter ist nicht bestellt, da die gesetzlichen Voraussetzungen nicht vorliegen.</p>

      <h2>2. Verarbeitete Daten, Zwecke und Rechtsgrundlagen</h2>

      <h3>Server-Logfiles</h3>
      <p>
        Beim Aufruf der Website verarbeitet der Server technisch notwendige Zugriffsdaten (IP-Adresse, Datum/Uhrzeit,
        abgerufene Ressource, übertragene Datenmenge, Browsertyp/-version, Betriebssystem). Zweck: technischer Betrieb,
        Stabilität und IT-Sicherheit. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h3>Geschäfts-Konto</h3>
      <p>
        Zur Einrichtung und Nutzung eines Kontos verarbeiten wir Firmenname, Name der Ansprechperson, E-Mail-Adresse und
        Zugangsdaten (Passwort wird ausschließlich verschlüsselt gespeichert). Zweck: Bereitstellung und Verwaltung des
        Zugangs zur Plattform StatusLine. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Nutzungsvertrag).
      </p>

      <h3>Konto- und System-E-Mails</h3>
      <p>
        Im Zusammenhang mit dem Konto versenden wir notwendige E-Mails (z. B. Registrierungsbestätigung,
        Passwort-Zurücksetzung, Service-Hinweise). Zweck: Verwaltung und Betrieb des Kontos. Rechtsgrundlage: Art. 6
        Abs. 1 lit. b DSGVO. Der Versand erfolgt über Brevo (siehe Ziffer 4).
      </p>

      <h2>3. Cookies</h2>

      <p>
        Wir verwenden ausschließlich <strong>technisch notwendige Cookies</strong>, die für den sicheren Betrieb des
        Anmeldebereichs erforderlich sind (Session-Cookie zur Aufrechterhaltung der Sitzung nach dem Login).
        Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich) i. V. m. Art. 6 Abs. 1 lit. f DSGVO. Eine
        Einwilligung ist hierfür nicht erforderlich.
      </p>

      <p>
        Es werden <strong>keine Tracking-, Analyse- oder Marketing-Cookies</strong> eingesetzt; es findet keine
        Reichweitenmessung und kein Profiling statt.
      </p>

      <h2>4. Empfänger / Auftragsverarbeiter</h2>

      <p>Mit folgenden Dienstleistern bestehen Verträge zur Auftragsverarbeitung (Art. 28 DSGVO):</p>

      <ul>
        <li>
          <strong>Hetzner Online GmbH</strong>, Industriestr. 25, 91710 Gunzenhausen, Deutschland – Hosting
          (Serverstandort Deutschland).
        </li>
        <li>
          <strong>Brevo GmbH</strong>, Köpenicker Str. 126, 10179 Berlin, Deutschland – Versand sämtlicher E-Mails
          (Konto- und System-E-Mails). Verarbeitung innerhalb der EU (Deutschland/Frankreich).
        </li>
      </ul>

      <p>Eine Übermittlung in Drittländer außerhalb der EU/des EWR findet nicht statt.</p>

      <h2>5. Speicherdauer</h2>

      <p>
        Kontodaten werden für die Dauer des Nutzungsverhältnisses gespeichert und nach dessen Beendigung gelöscht,
        soweit keine gesetzlichen Aufbewahrungspflichten (z. B. nach HGB/AO) entgegenstehen. Server-Logfiles werden nach
        spätestens 14 Tagen gelöscht.
      </p>

      <h2>6. Ihre Rechte</h2>

      <p>
        Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
        Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie auf Widerspruch gegen Verarbeitungen auf Grundlage
        von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Zur Ausübung genügt eine formlose Mitteilung an die unter Ziffer 1
        genannten Kontaktdaten.
      </p>

      <h2>7. Beschwerderecht</h2>

      <p>
        Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem
        Mitgliedstaat Ihres Aufenthaltsorts oder des Sitzes des Verantwortlichen. Für Rock Science ist dies der
        Hamburgische Beauftragte für Datenschutz und Informationsfreiheit (HmbBfDI).
      </p>

      <h2>8. Automatisierte Entscheidungsfindung</h2>

      <p>Eine automatisierte Entscheidungsfindung einschließlich Profiling findet nicht statt.</p>

      <p>Stand: 07.06.2026. Bei Änderungen der Verarbeitung wird diese Erklärung aktualisiert.</p>
    </div>
  )
}
