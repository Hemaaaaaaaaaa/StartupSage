// ------------------ MAIN JS ------------------
document.addEventListener("DOMContentLoaded", () => {
  const pdfInput = document.getElementById("pdfFile");
  const pdfUploadBtn = document.getElementById("pdfUploadBtn");
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");

  function typeMessage(element, message, speed = 30) {
    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length) {
        element.innerHTML += message.charAt(i);
        i++;
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
      } else clearInterval(interval);
    }, speed);
  }

  // ------------------ Upload PDF ------------------
  pdfUploadBtn.addEventListener("click", () => {
    const file = pdfInput.files[0];
    if (!file) return alert("Please select a PDF file!");

    const loadingMsg = document.createElement("p");
    loadingMsg.classList.add("chat-message", "ai");
    loadingMsg.textContent = "Processing your PDF...";
    chatBox.appendChild(loadingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];

      try {
        const response = await fetch(
          "http://127.0.0.1:5001/startupsage-b9fe8/us-central1/processPitchDeck",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfBase64: base64 })
          }
        );

        const data = await response.json();
        loadingMsg.innerHTML = "";

        if (data.summary) {
          // --- PDF response cleanup ---
          let cleaned = data.summary
            .replace(/\*\*/g, "") // remove bold
            .replace(/\*/g, "-"); // replace stars with dash for bullets

          cleaned.split("\n").forEach(line => {
            if (line.trim() !== "") {
              const p = document.createElement("p");
              p.textContent = line.trim();
              loadingMsg.appendChild(p);
            }
          });

        } else {
          typeMessage(loadingMsg, "Error: " + data.error, 30);
        }

      } catch (err) {
        console.error(err);
        loadingMsg.innerHTML = `<strong>AI Analyst:</strong> An error occurred while processing the PDF.`;
      }
    };
  });

  // ------------------ User Question ------------------
  sendBtn.addEventListener("click", async () => {
    const question = userInput.value.trim();
    if (!question) return;

    const userMsg = document.createElement("p");
    userMsg.classList.add("chat-message", "user");
    userMsg.textContent = question;
    chatBox.appendChild(userMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    userInput.value = "";

    const aiMsg = document.createElement("p");
    aiMsg.classList.add("chat-message", "ai");
    aiMsg.textContent = "Analyzing your question..."; // initial text
    chatBox.appendChild(aiMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const response = await fetch(
        "http://127.0.0.1:5001/startupsage-b9fe8/us-central1/processPitchDeck",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question })
        }
      );

      const data = await response.json();
      aiMsg.innerHTML = "";

      if (data.summary) {
        // --- USER RESPONSE: type exactly as original ---
        typeMessage(aiMsg, data.summary, 30);
      } else {
        typeMessage(aiMsg, "Error: " + data.error, 30);
      }

    } catch (err) {
      console.error(err);
      aiMsg.innerHTML = `<strong>AI Analyst:</strong> An error occurred while processing your question.`;
    }
  });

});
