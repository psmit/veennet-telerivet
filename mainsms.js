
var registration = require('./registration');
var m = require("./moment");

global.main = function() {

    switch (word1.toLowerCase()) {
        case "meldingen":
        case "melding":
            var group = project.getOrCreateGroup("meldingen");
            switch (word2.toLowerCase()) {
                case "aan":
                    contact.addToGroup(group);
                    sendReply("U bent nu aangemeld voor onderhoudsmeldingen en berichten bij grote storingen. U kunt dit altijd stoppen door 'MELDINGEN UIT' te sturen naar dit nummer. Wist u dat u ook storingen kunt melden per SMS.");
                    if (typeof(contact.vars.postal) === 'undefined' || contact.vars.postal.length === 0 ) {
                        registration.doRegistration("Om u beter van dienst te zijn vragen wij u eenmalig uw telefoonnummer te koppelen aan uw naam en adres.");
                    }
                    break;
                case "uit":
                case "stop":
                    if (contact.isInGroup(group)) {
                        contact.removeFromGroup(group);
                    }
                    sendReply("U bent nu afgemeld voor onderhoudsmeldingen en berichten bij grote storingen. U kunt dit altijd weer aanzetten door 'MELDINGEN AAN' te sturen naar dit nummer.");
                    break;
                default:
                    console.log("MELDINGEN "+word2 + " onbekend");
            }
            break;
        case "storing":
            handle_storing();
            break;
        default:
            var matches = content.match(/\s*([0-9]{4})\s*([A-Za-z]{2})\s*([0-9]+[A-Za-z]*)/);
            if (matches) {
                registration.parse_postal();
            } else {
                sendReply("Dank u wel voor uw bericht, wij zullen u zo spoedig mogelijk antwoorden.")
            }

    }

};


function handle_storing() {
    var replied = false;
    var storing = false;
    if (typeof(contact.vars.unmsclient) !== 'undefined' && contact.vars.unmsclient.length > 0) {
        var unms = require('./unms');
        var key = unms.get_key($UNMS_URL, $UNMS_USER, $UNMS_PASS);
        var outage = unms.get_outage($UNMS_URL, key, contact.vars.unmsclient);
        if (outage.success) {
            m.locale("nl");
            replied = true;
            if (outage.currentOutage) {
                if (outage.parentCurrentOutage) {
                    sendReply("Er is sinds " + m(outage.lastOutageStart).fromNow(true) +  " een storing in ons hoofdnetwerk. Wij proberen dit zo spoedig mogelijk op te lossen. Als u extra informatie voor ons heeft stuur ons dan nog een bericht.");
                } else {
                    sendReply("Er is inderdaad sinds "+ m(outage.lastOutageStart).fromNow(true) + " een storing op " + contact.vars.adres + ", het hoofdnetwerk heeft echter geen storing. Kunt u controleren dat uw ontvanger aanstaat en nog goed gericht staat? Kunt u ook proberen om de ontvanger opnieuw op te starten door de stroom er even af te halen en ongeveer 10 minuten te wachten. Als dit niet helpt, stuur ons dan meer informatie.");
                }
                storing=true;
            } else {
                sendReply("Onze systemen laten zien dat de verbinding op " + contact.vars.adres + " wel werkt op dit moment. Kunt u controleren dat het probleem niet in uw eigen netwerk is, bijvoorbeeld een probleem met de wifi. Als u dit gecontroleerd heeft en u heeft nog steeds problemen, stuur dan een bericht met een omschrijving van uw probleem.");
            }
        }
    }

    if (!replied) {
        sendReply("Dank u wel voor uw bericht, wij zullen proberen uw storing zo spoedig mogelijk te verhelpen.")
    }

    if (storing) {
        waitForResponse('storing_info', {
            timeoutMinutes: 10,
            timeoutId: 'storing_timeout'
        });
    }
}

addResponseHandler('storing_info', function() {
    if (word1.toLowerCase() == 'storing') {
        handle_storing();
    } else {
        sendReply("Dank u wel voor uw bericht, wij zullen proberen uw storing zo spoedig mogelijk te verhelpen. Als wij meer informatie nodig hebben nemen wij contact met u op.")
        waitForResponse('storing_info', {
            timeoutMinutes: 10,
            timeoutId: 'storing_timeout'
        })
    }
});

addTimeoutHandler('storing_timeout', function() {
    var repeat_timeout = false;
    if (typeof(contact.vars.unmsclient) !== 'undefined' && contact.vars.unmsclient.length > 0) {
        var unms = require('./unms');
        var key = unms.get_key($UNMS_URL, $UNMS_USER, $UNMS_PASS);
        var outage = unms.get_outage($UNMS_URL, key, contact.vars.unmsclient);
        if (outage.success && outage.currentOutage) {
            repeat_timeout = true;
        }
        if (outage.success && !outage.currentOutage) {
            m.locale("nl");
            sendReply("Volgens onze system werkt uw verbinding weer sinds " + m(outage.lastOutageEnd).fromNow(true) + ". Mocht u nog problemen hebben, meld dan een aub een nieuwe storing aan.");
        }
    }

    if (repeat_timeout) {
        console.log("Adding new storing timeout for " + contact.id);
        waitForResponse('storing_info', {
            timeoutMinutes: 10,
            timeoutId: 'storing_timeout'
        })
    }

});