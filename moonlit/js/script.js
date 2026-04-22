async function loadData(file) {
    const res = await fetch(file);
    return await res.json();
}

async function showSection(type) {
    const container = document.getElementById("content");
    container.innerHTML = "";

    if (type === "works") {
        const data = await loadData("data/works.json");
        data.forEach(w => {
            container.innerHTML += `
            <div class="card">
                <img src="${w.cover}" width="200"><br>
                <h3>${w.title}</h3>
                <p>${w.description}</p>
            </div>`;
        });
    }

    if (type === "characters") {
        const data = await loadData("data/characters.json");
        data.forEach(c => {
            container.innerHTML += `
            <div class="card">
                <img src="${c.image}" width="200"><br>
                <h3>${c.name}</h3>
                <p>${c.quote}</p>
            </div>`;
        });
    }

    if (type === "faq") {
        const data = await loadData("data/faqs.json");
        data.forEach(f => {
            container.innerHTML += `
            <div class="card">
                <b>${f.question}</b><br>
                ${f.answer}
            </div>`;
        });
    }
}
