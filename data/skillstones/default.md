# SKILLSTONE: VEKHARI
**Dialect ID:** default  
**Faction Profile:** Street-level, neutral-register pidgin used by unaffiliated fixers and grey-zone operators.  
**Word Order:** SVO (Subject → Verb → Object)  
**Negation:** Suffix **-da** on the verb  
**Tense System:** Particle-based, precedes the verb  

---

## Phonology

**Vowels:** a, e, i, o, u, ai, au  
**Consonants:** k, g, t, d, n, m, r, v, sh, zh, kh, ts  
**Forbidden clusters:** Three consecutive consonants; voiced-stop + voiced-stop (dd, gb, etc.)  
**Syllable Structure:** (C)V(C) — onset optional, coda optional  
**Stress:** Always falls on the penultimate syllable; monosyllables are unstressed.

**Phonological Notes:**
- 'kh' is a velar fricative (as in Scottish "loch") — used for contempt, commands, and proper nouns.
- 'zh' is a voiced palatal fricative (as in French "je") — used in whispered/covert speech.
- Vowel sequences resolve left-to-right: 'ai' = /aɪ/, 'au' = /aʊ/.

---

## Grammar

### Pronouns
| English     | Vekhari |
|-------------|---------|
| I / me      | nakh    |
| you (sg)    | zhi     |
| he / she    | oru     |
| we / us     | nakhra  |
| you (pl)    | zhira   |
| they / them | orura   |

### Tense Particles (precede the verb)
| Tense   | Particle | Notes                           |
|---------|----------|---------------------------------|
| PRESENT | *(none)* | Unmarked; particle omitted      |
| PAST    | **ra**   | "ra" + verb (space-separated)   |
| FUTURE  | **va**   | "va" + verb                     |
| HABITUAL| **shi**  | Ongoing or repeated actions     |

### Negation
- Append **-da** to the verb (after tense particle, before object).
- "I do not see you" → *nakh vekh-da zhi*

### Plurals
- Animate nouns: suffix **-ra**
- Inanimate nouns: suffix **-ek**

### Questions
- Append particle **ke** at end of sentence (rising intonation implied).
- "Are you a fixer?" → *zhi oruvek sheka ke*

### Possession
- Possessor precedes possessed noun, linked by **'s** → particle **-un**: *nakh-un kred* = "my credits"

---

## Core Lexicon (60 Words)

| English         | Vekhari    | Notes                              |
|-----------------|------------|------------------------------------|
| see / look      | vekh       | root verb for perception           |
| speak / say     | drath      | root verb for communication        |
| go / move       | koru       | root verb for motion               |
| take / get      | mekhi      | root verb for acquisition          |
| kill / destroy  | ghrut      | kh-cluster for intensity           |
| know            | shavi      | shi- prefix hints at habituality   |
| want / need     | tavi       |                                    |
| give            | nakoru     | lit. "I-go" → transfer             |
| hide / conceal  | zheva      | zh- cluster for covert actions     |
| run / escape    | koruda     |                                    |
| fixer           | sheka      |                                    |
| corpo / corp    | kharru     | pejorative register                |
| soldier / goon  | grunak     |                                    |
| netrunner       | zhiven     | zh- cluster (covert)               |
| money / credits | kred       |                                    |
| weapon / gun    | gutka      |                                    |
| door / entrance | mevok      |                                    |
| street          | ratka      |                                    |
| the Net         | zhinet     |                                    |
| building        | taruvek    |                                    |
| enemy           | khoru      | kh- hostile register               |
| friend / ally   | nakhi      |                                    |
| information     | shivra     |                                    |
| danger / risk   | ghreva     |                                    |
| safe / secure   | mekana     |                                    |
| now             | taku       | temporal marker                    |
| here            | ovu        |                                    |
| there           | ovura      |                                    |
| yes             | ka         |                                    |
| no              | da         | also serves as negation suffix     |
| please / request| zhaivi     |                                    |
| thank you       | nashka     |                                    |
| help / assist   | nakhi-koru | lit. "friend-go"                   |
| fast / quick    | tukra      |                                    |
| slow / wait     | mevika     |                                    |
| big / strong    | garuk      |                                    |
| small / weak    | tevika     |                                    |
| dead            | ghrutek    |                                    |
| alive           | koveka     |                                    |
| night           | zharuk     |                                    |
| day / light     | kavar      |                                    |
| up / above      | tavar      |                                    |
| down / below    | gruva      |                                    |
| left            | sheva      |                                    |
| right           | keva       |                                    |
| north           | varuk      |                                    |
| south           | grurak     |                                    |
| one             | nek        |                                    |
| two             | tave       |                                    |
| three           | goru       |                                    |
| many            | rakha      |                                    |
| zero / nothing  | daku       |                                    |
| mission / job   | tarka      |                                    |
| target          | khavi      | kh- hostile register               |
| escape route    | koruzheva  | lit. "run-hide"                    |
| ambush          | zheva-ghrut| lit. "hide-kill"                   |
| meet / rendezvous| nakoru-ovu | lit. "give-here"                  |
| signal / code   | zhivra     |                                    |
| abort / stop    | da-koru    | lit. "no-go"                       |

---

## Example Sentences

| English                              | Vekhari                                | Gloss                                     |
|--------------------------------------|----------------------------------------|-------------------------------------------|
| I see you.                           | *Nakh vekh zhi.*                       | I see you                                 |
| Run now!                             | *Koruda taku!*                         | Run now                                   |
| The fixer knows the target.          | *Sheka shavi khavi.*                   | Fixer know target                         |
| We did not take the credits.         | *Nakhra ra mekhi-da kred.*             | We PAST take-NEG credits                  |
| They will kill the enemy.            | *Orura va ghrut khoru.*                | They FUTURE kill enemy                    |
| Is the door secure?                  | *Mevok mekana ke*                      | Door secure QUESTION                      |
| Hide the information here.           | *Zheva shivra ovu.*                    | Hide information here                     |
| My friend is a netrunner.            | *Nakh-un nakhi orura zhiven.*          | My friend they netrunner                  |
| Go left, quickly.                    | *Koru sheva, tukra.*                   | Go left, quick                            |
| Abort the mission.                   | *Da-koru tarka.*                       | No-go mission                             |

---

## ICL Instructions for LLM

When generating dialogue for an NPC using VEKHARI, follow these rules exactly:

1. **Word Order is SVO.** Subject first, then verb, then object. Do not invert for emphasis — use kh- words instead.
2. **Apply tense particles** (ra/va/shi) as space-separated prefixes before the verb. Never conjugate the verb itself.
3. **Negation is always a verb suffix** (-da). Do not use 'da' as a standalone word for "no" in a sentence — reserve standalone 'da' for responses.
4. **Borrowed proper nouns** (character names, place names, corp names) are phonologically adapted: replace 'f' with 'v', 'w' with 'v', 'c/ck' with 'k'. Example: "Watson" → *Vatson*.
5. **Covert or whispered speech** uses zh- initial words wherever possible (substitute shivi → zhivi, sheka → zheka in covert register).
6. **Emotional intensity** is marked by inserting kh-initial intensifiers: *khar* (very/extremely) before adjectives and adverbs.
7. **Short tactical commands** omit the subject: "Go left fast" → *Koru sheva tukra.*
8. **Mix English and Vekhari** in a ratio appropriate to the NPC's education level. Low-edu NPCs use more Vekhari; corporate-educated NPCs use Vekhari only for slang or covert signals.
