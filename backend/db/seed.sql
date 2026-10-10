-- =========================================================
-- Sanatan API — starter seed data
-- A small, verified sample so the API returns real content on
-- day one. Load the full corpora separately from an
-- authoritative source (see README).
-- =========================================================

-- ---------- Bhagavad Gita ----------
insert into public.shloks_gita (chapter, verse, sanskrit, transliteration, hindi, english, meaning) values
(2, 20,
 'न जायते म्रियते वा कदाचिन् नायं भूत्वा भविता वा न भूयः। अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे॥',
 'na jāyate mriyate vā kadācin nāyaṁ bhūtvā bhavitā vā na bhūyaḥ / ajo nityaḥ śāśvato ''yaṁ purāṇo na hanyate hanyamāne śarīre',
 'आत्मा न कभी जन्म लेता है और न कभी मरता है। वह अजन्मा, नित्य, शाश्वत और पुरातन है; शरीर के मरने पर भी वह नहीं मरता।',
 'The soul is never born nor dies at any time. It is unborn, eternal, ever-existing and primeval; it is not slain when the body is slain.',
 'The Self is birthless and deathless; only the body perishes.'),

(2, 47,
 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
 'karmaṇy evādhikāras te mā phaleṣu kadācana / mā karma-phala-hetur bhūr mā te saṅgo ''stv akarmaṇi',
 'तुम्हारा अधिकार केवल कर्म करने में है, फलों में कभी नहीं। तुम कर्मों के फल के हेतु मत बनो, और तुम्हारी कर्म न करने में भी आसक्ति न हो।',
 'You have a right to perform your prescribed duties, but not to the fruits of your actions. Never consider yourself the cause of the results, nor be attached to inaction.',
 'Do your duty without attachment to the outcome.'),

(4, 7,
 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
 'yadā yadā hi dharmasya glānir bhavati bhārata / abhyutthānam adharmasya tadātmānaṁ sṛjāmy aham',
 'हे भारत! जब-जब धर्म की हानि और अधर्म की वृद्धि होती है, तब-तब मैं स्वयं प्रकट होता हूँ।',
 'Whenever and wherever there is a decline in righteousness, O descendant of Bharata, and a predominant rise of irreligion — at that time I manifest myself.',
 'The Divine manifests whenever dharma declines.'),

(4, 8,
 'परित्राणाय साधूनां विनाशाय च दुष्कृताम्। धर्मसंस्थापनार्थाय सम्भवामि युगे युगे॥',
 'paritrāṇāya sādhūnāṁ vināśāya ca duṣkṛtām / dharma-saṁsthāpanārthāya sambhavāmi yuge yuge',
 'साधुओं की रक्षा, दुष्कर्मियों के विनाश और धर्म की स्थापना के लिए मैं युग-युग में प्रकट होता हूँ।',
 'To deliver the pious, to annihilate the miscreants, and to re-establish the principles of dharma, I appear age after age.',
 'The purpose of divine descent: protect the good, remove evil, restore dharma.'),

(9, 22,
 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते। तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥',
 'ananyāś cintayanto māṁ ye janāḥ paryupāsate / teṣāṁ nityābhiyuktānāṁ yoga-kṣemaṁ vahāmy aham',
 'जो अनन्य भाव से मेरा चिन्तन करते हुए मेरी उपासना करते हैं, उन नित्य-युक्त भक्तों का योगक्षेम मैं स्वयं वहन करता हूँ।',
 'For those who worship me with devotion, meditating on me alone — I carry what they lack and preserve what they have.',
 'The Lord provides and protects the single-minded devotee.'),

(18, 66,
 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज। अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
 'sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja / ahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ',
 'समस्त धर्मों को त्यागकर केवल मेरी शरण में आ जाओ। मैं तुम्हें सब पापों से मुक्त कर दूँगा, शोक मत करो।',
 'Abandon all varieties of dharma and simply surrender unto me alone. I shall deliver you from all sinful reactions; do not fear.',
 'Surrender to the Divine removes all fear and sin.')
on conflict (chapter, verse) do nothing;

-- ---------- Rigveda ----------
insert into public.shloks_vedas (veda_name, mandala, sukta, mantra, sanskrit, transliteration, translation) values
('rigveda', 1, 1, 1,
 'अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम्। होतारं रत्नधातमम्॥',
 'agnim īḷe purohitaṁ yajñasya devam ṛtvijam / hotāraṁ ratnadhātamam',
 'I glorify Agni, the priest of the sacrifice, the divine ministrant, the invoker, the best bestower of treasure.'),

('rigveda', 3, 62, 10,
 'तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि। धियो यो नः प्रचोदयात्॥',
 'tat savitur vareṇyaṁ bhargo devasya dhīmahi / dhiyo yo naḥ pracodayāt',
 'We meditate on the excellent splendour of the sun-god Savitr, who shall stimulate our thoughts. (Gayatri Mantra)')
on conflict (veda_name, mandala, sukta, mantra) do nothing;

-- NOTE: Yajurveda, Samaveda and Atharvaveda samples are intentionally
-- omitted here so that no verse numbering is guessed. Import them from an
-- authoritative dataset (see README → "Loading the full corpora").
