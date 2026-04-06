import React, { useState } from "react";
import "./App.css";
import 'chart.js/auto';
import { Bar } from "react-chartjs-2";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState("");
  const [confidence, setConfidence] = useState("");
  const [loading, setLoading] = useState(false);

  // LOGIN
  const login = () => {
    if (username === "admin" && password === "1234") {
      setLoggedIn(true);
    } else {
      alert("Wrong credentials");
    }
  };

  // IMAGE
  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // ✅ PREDICT (HF CONNECTED)
  const predict = async () => {
    if (!image) {
      alert("Upload image first");
      return;
    }

    setLoading(true);

    const reader = new FileReader();

    reader.onload = async function () {
      const base64Image = reader.result.split(",")[1];

      try {
        const res = await fetch(
          "https://anil2111-cnn-backend.hf.space/run/predict",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: [base64Image],
            }),
          }
        );

        const data = await res.json();

        const output = data.data[0];

        // Example: "Prediction: Benign | Confidence: 92%"
        const parts = output.split("|");

        const prediction = parts[0].replace("Prediction:", "").trim();
        const conf = parts[1]
          .replace("Confidence:", "")
          .replace("%", "")
          .trim();

        setResult(prediction);
        setConfidence(conf);

      } catch (err) {
        alert("Error connecting to backend");
        console.error(err);
      }

      setLoading(false);
    };

    reader.readAsDataURL(image);
  };

  // CHART DATA
  const chartData = {
    labels: ["Confidence"],
    datasets: [
      {
        label: "Prediction %",
        data: [parseFloat(confidence || 0)],
        backgroundColor: ["#ff4d88"],
      },
    ],
  };

  // LOGIN UI
  if (!loggedIn) {
    return (
      <div className="login">
        <h2>🔐 Login</h2>

        <input
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>
      </div>
    );
  }

  // MAIN UI
  return (
    <div className="app">
      <h1>🎗️ AI Cancer Detection System</h1>

      <div className="container">
        
        {/* LEFT */}
        <div className="panel">
          <h3>Upload Image</h3>

          <input type="file" onChange={handleImage} />

          {preview && <img src={preview} alt="preview" />}

          <button onClick={predict}>Analyze</button>
        </div>

        {/* RIGHT */}
        <div className="panel">

          {loading ? (
            <div className="loader"></div>
          ) : result ? (
            <div className="result-card">

              <h2 className={result === "Malignant" ? "red" : "green"}>
                {result}
              </h2>

              <p>
                {parseFloat(confidence || 0).toFixed(2)}% Confidence
              </p>

              {/* CHART */}
              {confidence && !isNaN(confidence) && (
                <Bar data={chartData} />
              )}

              {/* MESSAGE */}
              <div className="ai-box">
                {result === "Malignant"
                  ? "⚠️ High risk detected. Please consult a doctor."
                  : "✅ Low risk detected. Stay safe."}
              </div>

            </div>
          ) : (
            <p>Upload image to start analysis</p>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;