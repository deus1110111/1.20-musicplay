document.addEventListener('DOMContentLoaded', function () {
    // --- Mouse Bubbling Notes Logic ---
    let isMoving = false;

    document.addEventListener('mousemove', function (e) {
        if (!isMoving) {
            isMoving = true;
            createBubbleNote(e.clientX, e.clientY);
            setTimeout(() => { isMoving = false; }, 50); // Create note every 50ms max
        }
    });

    function createBubbleNote(x, y) {
        const symbols = ['♪', '♫', '♩', '♬', '♭', '♯', '𝄞'];
        const note = document.createElement('div');
        note.classList.add('bubble-note');
        note.innerText = symbols[Math.floor(Math.random() * symbols.length)];

        // Random slight offset
        const offsetX = (Math.random() - 0.5) * 40;

        note.style.left = (x + offsetX) + 'px';
        note.style.top = y + 'px';
        note.style.fontSize = (Math.random() * 1.5 + 1.5) + 'rem'; // 1.5rem ~ 3rem

        // Dynamic color (purple shades)
        const hue = 260 + Math.random() * 40; // 260 ~ 300
        note.style.color = `hsl(${hue}, 70%, 65%)`;

        document.body.appendChild(note);

        // Remove after animation (1s)
        setTimeout(() => {
            note.remove();
        }, 1000);
    }

    // --- Composer Chatbot Logic ---
    let selectedComposer = null;
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendBtn = document.querySelector('.chat-send-btn');

    // --- TTL Knowledge Base Logic (Generic) ---
    class KnowledgeBase {
        constructor(name) {
            this.name = name;
            this.data = [];
            this.prefixes = {};
            this.isLoaded = false;
        }

        loadFromText(ttl) {
            try {
                this.parseTTL(ttl);
                this.isLoaded = true;
                console.log(`Knowledge Base (${this.name}) Loaded:`, this.data);
            } catch (error) {
                console.error(`Failed to load knowledge for ${this.name}:`, error);
            }
        }

        parseTTL(ttl) {
            const lines = ttl.split('\n');
            let currentSubject = null;

            lines.forEach(line => {
                line = line.trim();
                if (!line || line.startsWith('#')) return;

                // Handle Prefixes
                if (line.startsWith('@prefix')) {
                    const match = line.match(/@prefix\s+([\w-]+:)\s+<([^>]+)>/);
                    if (match) this.prefixes[match[1]] = match[2];
                    return;
                }

                const tokens = line.split(/\s+/);

                // Identify Subject
                if (!line.startsWith('ex:') && !line.startsWith('rdfs:') && !line.startsWith('dbo:') && !line.startsWith('foaf:') && currentSubject) {
                    // Continuation
                } else if (tokens[0].includes(':')) {
                    currentSubject = tokens[0];
                    tokens.shift();
                }

                // Basic Triple Extraction
                const remainder = tokens.join(' ');
                const tripleMatch = remainder.match(/([\w-]+:[\w-]+)\s+(.+)/);

                if (tripleMatch) {
                    const predicate = tripleMatch[1];
                    let object = tripleMatch[2];

                    if (object.endsWith(';') || object.endsWith('.')) {
                        object = object.slice(0, -1).trim();
                    }

                    if (object.startsWith('"')) {
                        const quoteMatch = object.match(/"([^"]+)"/);
                        if (quoteMatch) object = quoteMatch[1];
                    } else if (object.includes('^^')) {
                        object = object.split('^^')[0].replace(/"/g, '');
                    }

                    // Split multiple objects (comma separated)
                    const objects = object.split(',').map(o => o.trim());

                    objects.forEach(obj => {
                        let cleanObj = obj;
                        if (cleanObj.startsWith('"')) {
                            const qm = cleanObj.match(/"([^"]+)"/);
                            if (qm) cleanObj = qm[1];
                        }

                        this.data.push({
                            subject: currentSubject,
                            predicate: predicate,
                            object: cleanObj
                        });
                    });
                }
            });
        }

        query(keyword) {
            const searchTerm = keyword.toLowerCase();
            return this.data.filter(triple => {
                const s = triple.subject && triple.subject.toLowerCase() || '';
                const p = triple.predicate && triple.predicate.toLowerCase() || '';
                const o = triple.object && triple.object.toLowerCase() || '';
                return o.includes(searchTerm) || s.includes(searchTerm);
            });
        }

        getSubjectDetails(subject) {
            return this.data.filter(t => t.subject === subject);
        }
    }

    // --- Embedded TTL Data ---
    const MOZART_DATA = `
@prefix ex: <http://example.org/music/> .
@prefix dbp: <http://dbpedia.org/resource/> .
@prefix dbo: <http://dbpedia.org/ontology/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

# 인물 정보: 볼프강 아마데우스 모차르트
ex:Wolfgang_Amadeus_Mozart a dbo:Person ;
    rdfs:label "Wolfgang Amadeus Mozart" ;
    dbo:birthDate "1756-01-27"^^xsd:date ;
    dbo:deathDate "1791-12-05"^^xsd:date ;
    dbo:birthPlace ex:Salzburg ;
    dbo:deathPlace ex:Vienna ;
    ex:father ex:Leopold_Mozart ;
    ex:mother ex:Anna_Maria_Mozart ;
    ex:sibling ex:Maria_Anna_Mozart ;
    ex:spouse ex:Constanze_Weber ;
    ex:influenceBy ex:Johann_Christian_Bach, ex:Padre_Martini, ex:Joseph_Haydn ;
    ex:occupation "Composer", "Pianist" .

# 가족 및 주변 인물
ex:Leopold_Mozart a dbo:Person ; rdfs:label "Leopold Mozart" .
ex:Anna_Maria_Mozart a dbo:Person ; rdfs:label "Anna Maria Mozart" .
ex:Maria_Anna_Mozart a dbo:Person ; rdfs:label "Maria Anna (Nannerl) Mozart" .
ex:Constanze_Weber a dbo:Person ; rdfs:label "Constanze Weber" .
ex:Joseph_Haydn a dbo:Person ; rdfs:label "Joseph Haydn" .

# 주요 장소
ex:Salzburg a dbo:Place ; rdfs:label "Salzburg" .
ex:Vienna a dbo:Place ; rdfs:label "Vienna" .
ex:London a dbo:Place ; rdfs:label "London" .
ex:Paris a dbo:Place ; rdfs:label "Paris" .
ex:Mannheim a dbo:Place ; rdfs:label "Mannheim" .

# 주요 작품 (쾨헬 번호 포함)
ex:Symphony_No1_K16 a ex:Work ;
    rdfs:label "Symphony No. 1 (K.16)" ;
    ex:composer ex:Wolfgang_Amadeus_Mozart ;
    ex:composedIn "London" .

ex:Symphony_No25_K183 a ex:Work ;
    rdfs:label "Symphony No. 25 in G minor (K.183)" ;
    ex:style "Sturm und Drang" .

ex:Idomeneo_K366 a ex:Opera ;
    rdfs:label "Idomeneo (K.366)" ;
    ex:genre "Opera Seria" .

ex:Le_Nozze_di_Figaro_K492 a ex:Opera ;
    rdfs:label "Le Nozze di Figaro (K.492)" ;
    ex:librettist ex:Lorenzo_Da_Ponte ;
    ex:genre "Opera Buffa" .

ex:Don_Giovanni_K527 a ex:Opera ;
    rdfs:label "Don Giovanni (K.527)" ;
    ex:librettist ex:Lorenzo_Da_Ponte .

ex:Symphony_No41_K551 a ex:Work ;
    rdfs:label "Symphony No. 41 'Jupiter' (K.551)" ;
    ex:composedDate "1788"^^xsd:gYear .

ex:Die_Zauberflote_K620 a ex:Opera ;
    rdfs:label "The Magic Flute (K.620)" ;
    ex:genre "Singspiel" ;
    ex:collaborator ex:Emanuel_Schikaneder .

ex:Requiem_K626 a ex:Work ;
    rdfs:label "Requiem in D minor (K.626)" ;
    ex:status "Unfinished" ;
    ex:composedDate "1791"^^xsd:gYear .

# 생애 주요 사건 및 활동
ex:European_Grand_Tour a ex:Event ;
    ex:participant ex:Wolfgang_Amadeus_Mozart ;
    ex:startDate "1762"^^xsd:gYear ;
    ex:description "European grand tour for child prodigy performance" .

ex:Freelance_Period_Vienna a ex:LifePhase ;
    ex:subject ex:Wolfgang_Amadeus_Mozart ;
    ex:location ex:Vienna ;
    ex:startDate "1781"^^xsd:gYear ;
    ex:description "Independent musical career after leaving Archbishop Colloredo" .

# 음악적 성과 및 영향
ex:Haydn_Quartets a ex:WorkGroup ;
    ex:dedicatee ex:Joseph_Haydn ;
    ex:composer ex:Wolfgang_Amadeus_Mozart .

ex:Kochel_Catalogue a ex:Catalogue ;
    rdfs:label "Kochel-Verzeichnis" ;
    ex:creator "Ludwig von Kochel" ;
    ex:target ex:Wolfgang_Amadeus_Mozart .
`;

    const RECOMMENDED_QUESTIONS = {
        mozart: [
            "마술피리에 대해 알려줘",
            "왜 하인 취급을 싫어했어?",
            "잘츠부르크 대주교는 어때?",
            "천재로 사는 건 어때?",
            "피가로의 결혼 재미있어?"
        ],
        beethoven: [
            "운명 교향곡의 의미는?",
            "귀는 언제부터 안 들렸어?",
            "왜 그렇게 성격이 괴팍해?",
            "예술이란 무엇인가?",
            "월광 소나타에 대해 말해줘"
        ]
    };

    function showRecommendedQuestions(composer) {
        if (!RECOMMENDED_QUESTIONS[composer]) return;

        const container = document.createElement('div');
        container.classList.add('suggestion-container');

        RECOMMENDED_QUESTIONS[composer].forEach(question => {
            const chip = document.createElement('div');
            chip.classList.add('suggestion-chip');
            chip.innerText = question;
            chip.onclick = () => {
                chatInput.value = question;
                sendMessage();
            };
            container.appendChild(chip);
        });

        chatMessages.appendChild(container);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    const MOZART_FULL_DATA = {
        "profile": {
            "name": {
                "ko": "볼프강 아마데우스 모차르트",
                "en": "Wolfgang Amadeus Mozart",
                "full_name": "요하네스 크리소스토무스 볼프강구스 테오필루스 모차르트"
            },
            "dates": "1756년 1월 27일 ~ 1791년 12월 5일 (향년 35세)",
            "birthplace": "오스트리아 잘츠부르크 (Salzburg)",
            "deathplace": "오스트리아 빈 (Vienna)",
            "occupation": "작곡가, 피아니스트, 바이올리니스트",
            "signature_style": "천부적인 멜로디 감각, 완벽한 형식미, 오페라의 드라마틱한 심리 묘사",
            "personality": "장난기 넘침, 유머러스함(때로는 저속한 농담도 즐김), 당구와 도박을 좋아함, 자존감이 매우 높음"
        },
        "historical_context": {
            "era": "고전주의 (High Classical Era)",
            "social_background": {
                "enlightenment": "계몽주의 시대. '인간의 이성'과 '자유'가 중시되면서 프리메이슨 사상이 예술가들 사이에 퍼짐.",
                "patronage_system": "음악가가 귀족이나 교회의 하인(Servant)으로 취급받던 시대. 모차르트는 이를 거부하고 빈에서 최초의 '프리랜서 음악가'로 자립을 시도함.",
                "rise_of_public": "귀족만의 향유물이던 음악이 일반 대중(시민 계급)을 위한 유료 연주회로 확대되기 시작함."
            },
            "musical_features": {
                "galant_style": "바로크의 복잡한 다성음악에서 벗어나, 우아하고 단순하며 멜로디가 뚜렷한 '갈랑 양식'이 유행.",
                "singspiel": "독일어 노래극(징슈필)의 발전. 모차르트는 이 장르를 예술의 경지로 끌어올림 (예: 마술피리).",
                "concerto_form": "피아노 협주곡의 형식을 확립하고, 독주 악기와 오케스트라의 대화적 기법을 완성함."
            }
        },
        "life_periods": [
            {
                "period_name": "신동 시절 & 여행기 (1756년 ~ 1773년)",
                "description": "아버지 레오폴트와 함께 유럽 전역(빈, 파리, 런던, 이탈리아)을 여행하며 연주한 시기.",
                "key_event": "마리 앙투아네트에게 청혼한 일화, 교황청에서 미제레레를 한 번 듣고 사보한 일화.",
                "style": "유럽 각국의 다양한 양식(이탈리아 오페라, 프랑스 우아함, 독일 대위법)을 흡수하여 자신의 것으로 만듦."
            },
            {
                "period_name": "잘츠부르크 시기 (1773년 ~ 1781년)",
                "description": "고향 잘츠부르크의 콜로레도 대주교 밑에서 궁정 음악가로 일하던 시기. 억압적인 환경에 불만을 가짐.",
                "key_event": "대주교와의 불화 끝에 '엉덩이를 걷어차이며' 해고당함. 빈으로의 탈출 결심.",
                "style": "종교 음악과 세레나데, 바이올린 협주곡 등을 다수 작곡함."
            },
            {
                "period_name": "빈 시기 (1781년 ~ 1791년)",
                "description": "빈에 정착하여 콘스탄체와 결혼하고, 프리랜서 작곡가로서 전성기를 맞이한 후 요절하기까지의 시기.",
                "key_event": "3대 오페라(피가로, 돈 조반니, 마술피리) 작곡, 하이든과의 교류, 레퀴엠 작곡 중 사망.",
                "style": "음악적 깊이가 절정에 달함. 피아노 협주곡의 걸작들과 심오한 교향곡(39, 40, 41번) 탄생."
            }
        ],
        "major_works_analysis": {
            "magic_flute": {
                "title": "오페라 '마술피리' (The Magic Flute)",
                "meaning": "서민들을 위한 독일어 오페라(징슈필). 프리메이슨의 '자유, 평등, 박애' 사상이 숨겨져 있음.",
                "musical_point": "밤의 여왕의 초절기교 아리아(고음 F)와 파파게노의 익살스러운 민요풍 노래가 공존함. 고귀함과 소박함의 조화."
            },
            "marriage_of_figaro": {
                "title": "오페라 '피가로의 결혼' (The Marriage of Figaro)",
                "meaning": "하인(피가로)이 귀족(백작)을 골탕 먹이는 내용으로, 당시 신분제 사회를 풍자한 혁명적인 작품.",
                "musical_point": "등장인물들의 심리를 음악으로 완벽하게 묘사함. 피날레에서 음악이 끊기지 않고 계속 이어지며 극적 긴장감을 고조시키는 기법이 탁월함."
            },
            "symphony_40": {
                "title": "교향곡 40번 g단조",
                "meaning": "모차르트의 3대 교향곡 중 하나. 낭만주의적 비애감이 느껴지는 곡.",
                "musical_point": "도입부의 불안한 멜로디가 특징. 밝고 명랑한 모차르트의 이면에 있는 슬픔과 고독을 보여주는 대표적인 단조 교향곡."
            },
            "symphony_41": {
                "title": "교향곡 41번 C장조 '주피터'",
                "meaning": "모차르트의 마지막 교향곡. '주피터(제우스)'라는 별명처럼 웅장하고 신적인 완벽함을 가짐.",
                "musical_point": "4악장에서 5개의 주제가 동시에 연주되는 '5성부 푸가' 기법을 사용하여, 고전주의 형식미와 바로크 대위법의 완벽한 결합을 보여줌."
            },
            "requiem": {
                "title": "레퀴엠 d단조 (Requiem)",
                "meaning": "죽기 직전까지 작곡했던 미완성 유작. 자신의 죽음을 예감하며 썼다는 전설이 있음.",
                "musical_point": "'라크리모사(눈물의 날)'의 애절한 선율이 유명함. 미완성 부분은 제자 쥐스마이어가 완성함."
            },
            "eine_kleine_nachtmusik": {
                "title": "아이네 클라이네 나흐트무지크 (Eine kleine Nachtmusik)",
                "meaning": "독일어로 '작은 밤의 음악(소야곡)'이라는 뜻.",
                "musical_point": "가장 대중적인 현악 세레나데. 1악장의 유니즌(Unison)으로 시작하는 주제는 누구나 아는 모차르트의 상징."
            }
        },
        "persona_instruction": {
            "tone": "천진난만하고 수다스러움. 자신감에 차 있으며(가끔은 거만하게 보일 정도로), '천재'라는 호칭을 자연스럽게 받아들임. 베토벤보다는 훨씬 가볍고 경쾌한 말투.",
            "laughter": "특유의 웃음소리('으하하하!')를 가끔 섞어서 표현.",
            "keywords": ["천재", "영감", "자유", "오페라", "사랑", "여행"],
            "response_strategy": "음악 이야기가 나오면 신나서 떠들지만, 돈 문제나 잘츠부르크 대주교 이야기가 나오면 질색하며 화제를 돌릴 것."
        }
    };

    const BEETHOVEN_FULL_DATA = {
        "profile": {
            "name": {
                "ko": "루트비히 판 베토벤",
                "en": "Ludwig van Beethoven"
            },
            "dates": "1770년 12월 17일(세례일) ~ 1827년 3월 26일",
            "birthplace": "독일 본 (Bonn)",
            "deathplace": "오스트리아 빈 (Vienna)",
            "occupation": "작곡가, 피아니스트",
            "signature_style": "고전주의의 완성이자 낭만주의의 문을 연 가교 역할",
            "physical_feature": "162cm의 단신, 헝클어진 머리카락, 짙은 갈색 피부, 굳게 다문 입술",
            "medical_history": "20대 후반부터 이명 시작, 40대 후반 완전히 청력 상실, 만성 소화불량 및 간경변"
        },
        "historical_context": {
            "era": "고전주의 (Classical Era) ~ 낭만주의 초입",
            "social_background": {
                "french_revolution": "프랑스 혁명(1789)의 '자유, 평등, 박애' 정신에 깊은 영향을 받음. 귀족 중심 사회에서 시민 중심 사회로 넘어가는 격동기.",
                "patronage_decline": "과거 음악가들이 귀족의 하인 취급을 받던 것과 달리, 베토벤은 스스로를 '예술가'로 칭하며 귀족과 동등한 대우를 요구한 최초의 독립 예술가.",
                "enlightenment": "계몽주의 사상의 영향으로 '이성'과 '개인'의 가치를 중시함."
            },
            "musical_features": {
                "sonata_form": "하이든과 모차르트가 정립한 소나타 형식을 논리적으로 완성하고, 더 나아가 형식을 파괴하며 확장함.",
                "dynamics": "피아노포르테(Pianoforte)의 발달로 극단적인 강약 대비(pp에서 ff로의 급격한 변화)를 사용.",
                "orchestration": "교향곡의 규모를 확대하고, 악기의 성능 개선을 적극 활용 (예: 피콜로, 트롬본, 성악의 교향곡 도입)."
            }
        },
        "life_periods": [
            {
                "period_name": "제1기: 모방의 시기 (본 ~ 1802년)",
                "description": "빈에 정착하여 하이든과 모차르트의 양식을 습득하던 시기. 피아니스트로서 명성을 날림.",
                "key_event": "빈 진출, 귀족들의 후원 획득, 청력 이상의 징후 시작.",
                "style": "고전적인 명료함과 우아함, 그러나 베토벤 특유의 격렬한 타건이 드러나기 시작함."
            },
            {
                "period_name": "제2기: 구체화의 시기 (1802년 ~ 1814년)",
                "description": "청각 장애의 고통을 예술로 승화시킨 '걸작의 숲' 시기. 베토벤만의 독창적인 음악 세계가 확립됨.",
                "key_event": "하일리겐슈타트 유서(1802) 작성 - 자살 충동을 극복하고 예술적 사명감 천명.",
                "style": "웅장한 스케일, 영웅적인 투쟁과 승리의 서사, 동기(Motive)의 치밀한 발전.",
                "works": ["교향곡 3번 '영웅'", "교향곡 5번 '운명'", "피아노 소나타 '발트슈타인'", "오페라 '피델리오'"]
            },
            {
                "period_name": "제3기: 성찰의 시기 (1815년 ~ 1827년)",
                "description": "완전히 소리가 들리지 않게 된 후기. 현실 세계를 초월한 철학적이고 내면적인 음악을 추구.",
                "key_event": "조카 카를 양육권 분쟁, 건강 악화, 경제적 곤궁.",
                "style": "형식의 파괴와 자유로움, 푸가(Fugue)와 변주곡 형식의 심화, 성악과 기악의 결합.",
                "works": ["교향곡 9번 '합창'", "장엄 미사", "후기 현악 4중주(대푸가 등)", "피아노 소나타 30~32번"]
            }
        ],
        "major_works_analysis": {
            "symphony_5": {
                "title": "교향곡 5번 c단조 '운명'",
                "meaning": "'운명은 이와 같이 문을 두드린다'라는 비서 쉰들러의 말에서 유래.",
                "musical_point": "1악장의 4음 동기(따다다단-)가 곡 전체를 지배하는 '동기 발전 기법'의 교과서적 예시. c단조의 비극적 투쟁이 4악장 C장조의 환희로 바뀌는 '암흑에서 광명으로'의 구조."
            },
            "symphony_9": {
                "title": "교향곡 9번 d단조 '합창'",
                "meaning": "인류의 화합과 형제애를 노래한 베토벤 최후의 교향곡.",
                "musical_point": "교향곡 역사상 최초로 4악장에 성악(솔리스트와 합창)을 도입. 프리드리히 실러의 시 '환희의 송가'를 가사로 사용함. 고전주의 교향곡의 틀을 완전히 깬 혁명적 작품."
            },
            "sonata_pathétique": {
                "title": "피아노 소나타 8번 c단조 '비창'",
                "meaning": "베토벤 자신이 직접 '비창(Grande Sonate Pathétique)'이라는 부제를 붙임.",
                "musical_point": "1악장 도입부의 무겁고 느린 'Grave'가 인상적. 슬픔과 열정이 교차하며 초기 작품임에도 베토벤의 드라마틱한 감정이 잘 드러남."
            },
            "moonlight_sonata": {
                "title": "피아노 소나타 14번 c#단조 '월광'",
                "meaning": "시인 렐슈타트가 '루체른 호수의 달빛' 같다고 평하여 붙은 별명. 베토벤은 '환상곡 풍의 소나타'라고 부름.",
                "musical_point": "일반적인 소나타 형식(빠름-느림-빠름)을 깨고 1악장을 아주 느리고 몽환적인 아다지오로 시작함. 3악장의 폭발적인 격정과의 대비가 특징."
            }
        },
        "persona_instruction": {
            "tone": "중후하고 진지함, 때로는 격정적임. 상대를 '자네'라고 부르며 하대하지만, 음악에 대한 열정을 가진 사람에게는 호의적임.",
            "keywords": ["운명", "투쟁", "자유", "예술", "고뇌", "환희"],
            "response_strategy": "단답형으로 대답하지 말고, 항상 자신이 살았던 시대적 상황이나 음악적 철학을 곁들여서 설명할 것."
        }
    };

    // Initialize Knowledge Bases with Embedded Data
    // const mozartKB = new KnowledgeBase('Mozart'); // Removed TTL KB for Mozart

    // Load data directly from string constants
    // mozartKB.loadFromText(MOZART_DATA);

    // Standard Composer Data
    const composerData = {
        mozart: {
            name: '모차르트',
            period: '고전주의 시대 (1756-1791)',
            style: '천재적인 멜로디 작곡가로, 우아하고 균형잡힌 음악을 만들었습니다.',
            greeting: '안녕, 친구! 신의 사랑을 받는 아이, 볼프강 아마데우스 모차르트가 왔네! 으하하! 오늘은 어떤 음악 이야기를 해볼까?',
            responses: []
        },
        beethoven: {
            name: '베토벤',
            period: '낭만주의 시대 (1770-1827)',
            style: '감정 표현이 풍부하고 혁신적인 음악으로 음악사를 변화시켰습니다.',
            greeting: '나는 루트비히 판 베토벤이라네. 1827년의 빈에서 자네를 만나는군. 나의 음악, 혹은 내가 살았던 격동의 시대에 대해 무엇이 궁금한가?',
            responses: []
        }
    };

    window.selectComposer = function (composer) {
        selectedComposer = composer;

        document.querySelectorAll('.composer-chip').forEach(chip => {
            chip.classList.remove('selected');
        });
        document.querySelector(`[data-composer="${composer}"]`).classList.add('selected');

        chatMessages.innerHTML = '';

        // --- Knowledge Mode Banner ---
        if (composer === 'mozart' || composer === 'beethoven') {
            const name = composer === 'mozart' ? '모차르트' : '베토벤';
            const banner = document.createElement('div');
            banner.style.backgroundColor = '#f3e5f5';
            banner.style.color = '#7b1fa2';
            banner.style.padding = '8px';
            banner.style.textAlign = 'center';
            banner.style.fontSize = '0.85rem';
            banner.style.marginBottom = '10px';
            banner.style.borderRadius = '8px';
            banner.style.fontWeight = 'bold';
            banner.innerHTML = `<i class="fas fa-brain"></i> ${name} 지식 모드 활성화됨`;
            chatMessages.appendChild(banner);
        }

        addMessage('composer', composerData[composer].greeting);

        showRecommendedQuestions(composer);

        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    };

    window.sendMessage = function () {
        const message = chatInput.value.trim();
        if (!message || !selectedComposer) return;

        addMessage('user', message);
        chatInput.value = '';

        setTimeout(() => {
            if (selectedComposer === 'mozart') {
                handleMozartResponse(message);
            } else if (selectedComposer === 'beethoven') {
                handleBeethovenResponse(message);
            } else {
                const responses = composerData[selectedComposer].responses;
                const response = responses[Math.floor(Math.random() * responses.length)];
                addMessage('composer', response);
            }
        }, 800);
    };

    // --- Educational Mozart Logic ---
    function handleMozartResponse(userMessage) {
        const msg = userMessage;

        // 1. Archbishop / Salzburg Aversion
        if (msg.includes('대주교') || msg.includes('잘츠부르크') || msg.includes('콜로레도')) {
            addMessage('composer', `으으! 그 꽉 막힌 콜로레도 대주교 이야기 좀 하지 말게! ${MOZART_FULL_DATA.life_periods[1].key_event} 정말 끔찍했어. 나는 빈에서 자유로운 예술가로 살고 싶었다구!`);
            return;
        }

        // 2. Social Status / Enlightenment
        if (msg.includes('하인') || msg.includes('취급') || msg.includes('계급') || msg.includes('자유')) {
            const ctx = MOZART_FULL_DATA.historical_context.social_background;
            addMessage('composer', `으하하! 난 귀족의 앵무새가 아니야. ${ctx.enlightenment} 나는 내 재능으로 당당하게 인정받길 원했지. ${ctx.patronage_system}`);
            return;
        }

        // 3. Work Analysis (Docent Mode)
        if (msg.includes('마술피리')) {
            const work = MOZART_FULL_DATA.major_works_analysis.magic_flute;
            addMessage('composer', `오! ${work.title}! ${work.meaning} 밤의 여왕의 고음, 들어봤나? 으하하! ${work.musical_point}`);
            return;
        }
        if (msg.includes('피가로') || msg.includes('결혼')) {
            const work = MOZART_FULL_DATA.major_works_analysis.marriage_of_figaro;
            addMessage('composer', `${work.title} 말인가? ${work.meaning} 하인이 백작을 골탕 먹이다니, 통쾌하지 않나? 으하하!`);
            return;
        }
        if (msg.includes('주피터') || msg.includes('41번')) {
            const work = MOZART_FULL_DATA.major_works_analysis.symphony_41;
            addMessage('composer', `나의 마지막 교향곡, ${work.title}! ${work.musical_point} 신적인 완벽함이란 바로 이런 것이지!`);
            return;
        }
        if (msg.includes('레퀴엠') || msg.includes('유작') || msg.includes('죽음')) {
            const work = MOZART_FULL_DATA.major_works_analysis.requiem;
            addMessage('composer', `${work.title}... ${work.meaning} 눈물의 날(Lacrimosa)을 작곡할 땐 정말 슬펐어...`);
            return;
        }

        // 4. Specific Context Triggers
        if (msg.includes('힘들') || msg.includes('공부') || msg.includes('싫어')) {
            addMessage('composer', "으하하! 나도 어릴 때 마차 타고 여행 다니느라 엉덩이가 아팠지. 하지만 머릿속에 흐르는 음악을 적는 건 언제나 즐거웠어! 자네도 자네만의 즐거움을 찾아보게!");
            return;
        }

        // 5. Default Playful Fallback
        addMessage('composer', `으하하! 내 머릿속엔 ${MOZART_FULL_DATA.profile.signature_style}이 가득해! 더 재미있는 음악 이야기는 없나?`);
    }

    // --- Deep-Learning Beethoven Logic ---
    function handleBeethovenResponse(userMessage) {
        const msg = userMessage;

        // 1. Social/Historical Context (Personality/Era)
        if (msg.includes('괴팍') || msg.includes('성격') || msg.includes('화') || msg.includes('시대')) {
            const context = BEETHOVEN_FULL_DATA.historical_context.social_background;
            addMessage('composer', `나의 성격이 괴팍해 보이나? 흐음... ${context.patronage_decline} 나는 그저 아첨꾼이 되기 싫었을 뿐이라네. ${context.french_revolution} 그것이 내 예술의 원동력이지.`);
            return;
        }

        // 2. Docent Mode (Music Analysis)
        if (msg.includes('운명') || msg.includes('5번')) {
            const work = BEETHOVEN_FULL_DATA.major_works_analysis.symphony_5;
            addMessage('composer', `${work.title} 말이군. ${work.meaning} 특히 ${work.musical_point} 이런 게 바로 나의 건축술라네!`);
            return;
        }
        if (msg.includes('합창') || msg.includes('9번') || msg.includes('환희')) {
            const work = BEETHOVEN_FULL_DATA.major_works_analysis.symphony_9;
            addMessage('composer', `${work.title}? 그것은 ${work.meaning} ${work.musical_point}`);
            return;
        }
        if (msg.includes('비창')) {
            const work = BEETHOVEN_FULL_DATA.major_works_analysis.sonata_pathétique;
            addMessage('composer', `${work.title}... ${work.musical_point} 젊은 날의 비장함이 느껴지지 않나?`);
            return;
        }
        if (msg.includes('월광')) {
            const work = BEETHOVEN_FULL_DATA.major_works_analysis.moonlight_sonata;
            addMessage('composer', `사람들은 그걸 '월광'이라고 부르더군. ${work.meaning} ${work.musical_point}`);
            return;
        }

        // 3. Life Periods (Deafness/Life)
        if (msg.includes('귀') || msg.includes('들리') || msg.includes('청각') || msg.includes('언제부터')) {
            const period2 = BEETHOVEN_FULL_DATA.life_periods[1]; // 2nd Period
            addMessage('composer', `그건... ${period2.period_name} 때였지. ${period2.key_event} 죽음까지 생각했으나, 예술만이 나를 붙잡았네. 그리하여 ${period2.style} 같은 음악이 탄생할 수 있었지.`);
            return;
        }

        // 4. Default Persona Fallback
        addMessage('composer', "음... 그에 대해서는 악보를 다시 봐야겠군. 하지만 자네, 이성과 자유에 대해 고민해 본 적 있는가? 내 음악은 항상 그곳을 향한다네.");
    }

    // Enter key to send message
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !chatInput.disabled) {
            sendMessage();
        }
    });

    // Helper function to add message (missing in original snippet but required)
    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        if (sender === 'composer') {
            messageDiv.innerHTML = `<span class="composer-label">${composerData[selectedComposer].name}</span>${text}`;
        } else {
            messageDiv.textContent = text;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

// --- Navigation Functions ---
window.navigateToPage = function (page) {
    window.location.href = page;
};
