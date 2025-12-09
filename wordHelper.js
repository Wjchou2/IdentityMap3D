const stopwords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "is",
    "are",
    "am",
    "be",
    "i",
    "you",
    "he",
    "she",
    "they",
    "we",
    "it",
    "this",
    "that",
    "these",
    "those",
]);

async function loadWords() {
    const res = await fetch("words.txt");
    const text = await res.text();
    return new Set(text.split("\n").map((w) => w.trim().toLowerCase()));
}

let words;

loadWords().then((w) => {
    words = w;
    console.log("Words loaded");
});

export function isWord(word) {
    return words?.has(word.toLowerCase()) || false;
}

export function hasIdentityLikeWord(text) {
    const tokens = (text.toLowerCase().match(/[a-z]+/g) || []).filter(
        (t) => t.length > 2 && !stopwords.has(t)
    );
    return tokens.length > 0; // “baseball”, “cat”, “artist”, “gamer” all pass
}
