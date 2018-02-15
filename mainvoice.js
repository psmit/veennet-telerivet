
var unms = require("./unms");
var m = require("./moment");
var registration = require('./registration');

global.main = function() {
    setVoice("nl-NL", 'male');
    sayText("Dit is de technische dienst van Veennet punt com. Heeft u een storing, toets 1. Heeft u een andere vraag, toets 2.");
    promptKey("choice");
};

addInputHandler("choice", function(input) {
    setVoice("nl-NL", 'male');
    if (input == '1') {
        var replied = false;
        if (typeof(contact.vars.unmsclient) !== 'undefined' && contact.vars.unmsclient.length > 0) {
            var key = unms.get_key($UNMS_URL, $UNMS_USER, $UNMS_PASS);
            var outage = unms.get_outage($UNMS_URL, key, contact.vars.unmsclient);
            if (outage.success) {
                m.locale("nl");
                replied = true;
                if (outage.currentOutage) {
                    if (outage.parentCurrentOutage) {
                        sayText("Er is sinds " + m(outage.lastOutageStart).fromNow(true) +  " een storing in ons hoofdnetwerk. Wij proberen dit zo spoedig mogelijk op te lossen. Als u extra informatie voor ons heeft dan kunt een bericht achterlaten na de piep.");
                    } else {
                        sayText("Er is inderdaad sinds "+ m(outage.lastOutageStart).fromNow(true) + " een storing op " + contact.vars.adres + ", het hoofdnetwerk heeft echter geen storing. Kunt u controleren dat uw ontvanger aanstaat en nog goed gericht staat? Kunt u ook proberen om de ontvanger opnieuw op te starten door de stroom er even af te halen en ongeveer 10 minuten te wachten. Als dit niet helpt, spreek dan een bericht in na de piep.");
                    }
                    sendReply("Stuur ons een berichtje met het woord STORING, en u krijgt automatisch bericht als de storing is opgelost.");
                } else {
                    sayText("Onze systemen laten zien dat de verbinding op " + contact.vars.adres + " wel werkt op dit moment. Kunt u controleren dat het probleem niet in uw eigen netwerk is, bijvoorbeeld een probleem met de wifi. Als u dit gecontroleerd heeft en u heeft nog steeds problemen, laat dan een bericht achter na de piep.");
                }

            }
        }
        if (!replied) {
            sayText("Omschrijf uw storing na de piep. Vergeet niet uw naam en aansluitadres te vermelden. Wij zullen uw melding zo spoedig mogelijk behandelen.");
            if (typeof(contact.vars.postal) === 'undefined' || contact.vars.postal.length === 0 ) {
                registration.doRegistration("Om u beter van dienst te zijn vragen wij u eenmalig uw telefoonnummer te koppelen aan uw naam en adres.");
            }
        }
    } else {
        sayText("Spreek uw bericht in na de piep, wij nemen binnen twee werkdagen contact met u op.");
    }
    recordAudio("voicemail");
});

addInputHandler("voicemail", function(input) {
    var table = project.getOrCreateDataTable("Voicemails");
    table.createRow({
        contact_id: contact.id,
        from_number: contact.phone_number,
        vars: {
            'voicemail': input
        }
    }).save();

    return 0;
});