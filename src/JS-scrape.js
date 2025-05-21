NGROK_CURRENT = 'https://96eb-2601-1c0-847f-af0-6c09-e6a5-aa13-f1c4.ngrok-free.app/receive';


class Question {
    constructor(text) {
        this.text = text || '';
        this.lines = this.text.split('\n');
        this.question = this.lines[0];
        this.options = this.lines.slice(2);
    }
    getText() {
        console.log(`QUESTION: ${this.question}`);
        console.log(`OPTIONS: ${this.options}`);
        return;
    }
}


function searchForPrompts(timeout = 10000) {
    return new Promise((resolve, reject) => {
        let intervalTime = 100;
        let maxAttempts = timeout / intervalTime;
        let attempts = 0;

        let interval = setInterval(() => {
            let elements = Array.from(document.getElementsByClassName('text')).filter(function(el) {
                return el.offsetParent !== null;  
            });

            if (elements.length > 0) {
                clearInterval(interval);
                resolve(elements);
                }

            if (++attempts > maxAttempts) {
                clearInterval(interval);
                reject(new Error('Failed to access elements'));
            }


        }, intervalTime);
    });
}

function queryAPI(question, choices, n){
    let url = NGROK_CURRENT;
    let data = {
        question: question,
        choices: choices
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(`API Response ${n}:`, (data['answer'] ? data['answer'] : data['response']));
    })
    .catch(error => {
        console.error('Error querying API:', error);
    });
}

async function main(){
    try{
        const elements = await searchForPrompts(10000);
        let n = 0;
        for (const el of elements) {
            n += 1;
            let q = new Question(el.innerText);
            await queryAPI(q.question, q.options, n);
        }
    } catch (err) {
        console.error(err);
    }
}

main();
