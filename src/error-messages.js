const or = new Intl.ListFormat("nl", {
  style: "long",
  type: "disjunction",
});

const and = new Intl.ListFormat("nl", {
  style: "long",
  type: "conjunction",
});

export const errorMessages = {
  "no-number": ({ message }) => [
    `Bij mijn weten starten getallen met een ${or.format(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => `\`${x}\``),
    )}, maar goed bij u niet blijkbaar.`,
    "Dat start hier niet met een getal he vriend?",
    "Ai, de getallekes waren op vanochtend precies.",
    `Ah bon, staat er bij u een \`${message.content[0]}\` op uw rekenmachine misschien?`,
    "Voor mij 100gram prepare alstublieft. Oh, en een getal in uw bericht.",
    "Oei, gebruikte gij een rekenmachine van de Action? Want die werkt niet.",
    `Wist je dat \`${
      message.content.split(" ")[0]
    }\` geen getal is? Dus ja, dat is dan fout.`,
    `Wiskunde is moeilijk, maar meestal is dat wel met getallekes.`,
    "Oei, hebde gij een woordenboek naast u liggen in plaats van een rekenmachine?",
  ],
  "leading-zero": ({ raw, number }) => [
    "Dag bakker, voor mij nul twaalf broden alstublieft. Ja raar he, stopt er mee.",
    "Nee, nee, nee, een `0` is nie goe!",
    "Een `0`? Vooraan? Ja dat is fout.",
    "Dat is een `0` vooraan. Dat is jammer.",
    `Ja ge hebt gelijk \`${raw}\` is hetzelfde als \`${number}\` in de wiskune. Maar verwarrend, wat is het volgende? \`${"0".repeat(
      30,
    )}${number}\`. Dus nee, geen \`0\` vooraan.`,
  ],
  "trailing-character": ({ character, number }) => [
    `En wat doet die \`${character}\` daar na het getal \`${number}\`?`,
    `Hallo bakker, voor mij \`${number}${character}\` ${
      number === 1 ? "brood" : "broden"
    } alstublieft. Dat verstaat die mens toch niet?`,
  ],
  "wrong-number": ({ expected, actual, message }) => [
    `Fout getal, ik had een \`${expected}\` verwacht, maar zag een \`${actual}\`. Dat is niet zo goed geteld!`,
    `Wist je dat na \`${
      expected - 1
    }\` het getalletje \`${expected}\` komt? En dus niet \`${actual}\`.`,
    `Jammer maar helaas pindakaas, ik had een \`${expected}\` verwacht, maar zag een \`${actual}\`.`,
    `Seg vriendschap, \`${
      expected - 1
    } + 1\` is \`${expected}\` en niet \`${actual}\`.`,
    `Ah ${message.author} heeft leren tellen op de zwemschool.`,
    `Ja, we mogen naar huis, gedaan met spelen. Doe maar opnieuw...`,
  ],
  "too-few-unique-people": ({ messagesCount, authorsCount }) => {
    return messagesCount !== authorsCount
      ? [
          `Ola, ge dacht hier zijn \`${messagesCount}\` ${
            messagesCount === 1 ? "bericht" : "berichten"
          }, maar helaas ${
            authorsCount === 1 ? "is" : "zijn"
          } er maar \`${authorsCount}\` unieke ${
            authorsCount === 1 ? "persoon" : "personen"
          } die iets gestuurd ${authorsCount === 1 ? "heeft" : "hebben"}...`,
          `\`${messagesCount}\`\ ${
            messagesCount === 1 ? "bericht" : "berichten"
          } dat is just. Maar hiervoor konden ze blijkbaar ook niet tellen want er ${
            authorsCount === 1 ? "is" : "zijn"
          } maar \`${authorsCount}\` unieke ${
            authorsCount === 1 ? "persoon" : "personen"
          } die iets gestuurd ${authorsCount === 1 ? "heeft" : "hebben"}...`,
        ]
      : [
          `Oei, er ${
            messagesCount === 1 ? "zat" : "zaten"
          } maar \`${messagesCount}\` ${
            messagesCount === 1 ? "bericht" : "berichten"
          } tussen dit bericht en jouw laatste bericht.`,
          `Hebde gij leren tellen in de zwemschool? Er ${
            messagesCount === 1 ? "zit" : "zitten"
          } hier maar \`${messagesCount}\` ${
            messagesCount === 1 ? "bericht" : "berichten"
          } tussen dit en uw laatste bericht.`,
          `Goed gedaan! Maar wel fout. Helaas. Er ${
            messagesCount === 1 ? "zit" : "zitten"
          } maar \`${messagesCount}\` ${
            messagesCount === 1 ? "bericht" : "berichten"
          } tussen dit en uw laatste bericht.`,
          `NOOOOOOOOOOOOOOOOO! Kijk eens wanneer uw laatste bericht was. Yep, dat was maar \`${messagesCount}\` ${
            messagesCount === 1 ? "bericht" : "berichten"
          } geleden.`,
        ];
  },
  "message-edited": [
    `Awel, wat zijn we van plan? Bericht aanpassen? Stout.`,
    `Ge dacht dat ik het niet gezien had he? Hup opnieuw.`,
    `Bon, ik heb het gezien. Ge moet niet proberen 😡.`,
    `Dat is hier geen edit-club he.`,
    `Moest dat nu echt? Nu moet ik weer opnieuw tellen.`,
    `Ik zit vast in een computer en jij gaat berichten aanpassen?`,
    `Ik heb het gezien, maar ik ga het negeren. Ik ben niet boos, ik ben teleurgesteld. Nee zot, begint maar opnieuw!`,
    `Wil je een koekje? Ja? Dan moet je ook niet aan berichten prutsen.`,
  ],
};
