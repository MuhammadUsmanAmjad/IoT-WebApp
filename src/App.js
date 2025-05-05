/* global mqtt */
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import mqtt from "mqtt";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const App = () => {
  const [co2, setCo2] = useState(0);
  const [pm25, setPm25] = useState(0);
  const [temp, setTemp] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [pm25Data, setPm25Data] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  useEffect(() => {
    console.log("App mounted");

    const options = {
      host:
        process.env.REACT_APP_MQTT_HOST ||
        "4547d51320d54e74be02bb04e3c1b342.s1.eu.hivemq.cloud",
      port: 8884,
      protocol: "wss",
      path: "/mqtt",
      username: process.env.REACT_APP_MQTT_USERNAME || "envscan",
      password: process.env.REACT_APP_MQTT_PASSWORD || "Abcd1234",
      clientId: "WebApp_EnviroScan_" + Math.random().toString(16).slice(3),
      reconnectPeriod: 1000,
      connectTimeout: 30000,
    };

    const connectUrl = `wss://${options.host}:${options.port}${options.path}`;
    console.log("Connecting to:", connectUrl);

    const client = mqtt.connect(connectUrl, options);

    const latestData = {
      co2: 0,
      pm25: 0,
      temp: 0,
      humidity: 0,
    };

    client.on("connect", () => {
      console.log("✅ Connected to MQTT Broker");
      setConnectionStatus("Connected");
      client.subscribe(
        [
          "enviroscan/co2",
          "enviroscan/pm25",
          "enviroscan/temp",
          "enviroscan/humidity",
        ],
        (err) => {
          if (err) {
            console.error("Subscription error:", err);
            setConnectionStatus("Subscription failed");
          } else {
            console.log("📡 Subscribed to topics");
          }
        }
      );
    });

    client.on("message", (topic, message) => {
      const value = message.toString();
      console.log(`📥 ${topic}: ${value}`);

      switch (topic) {
        case "enviroscan/co2":
          latestData.co2 = parseFloat(value);
          break;
        case "enviroscan/pm25":
          latestData.pm25 = parseFloat(value);
          break;
        case "enviroscan/temp":
          latestData.temp = parseFloat(value);
          break;
        case "enviroscan/humidity":
          latestData.humidity = parseFloat(value);
          break;
        default:
          break;
      }
    });

    client.on("error", (err) => {
      console.error("❌ MQTT Error:", err);
      setConnectionStatus("Error: " + err.message);
    });

    client.on("reconnect", () => {
      console.log("🔄 Reconnecting...");
      setConnectionStatus("Reconnecting...");
    });

    client.on("close", () => {
      console.log("❌ Disconnected");
      setConnectionStatus("Disconnected");
    });

    // UI update every 10 seconds
    const interval = setInterval(() => {
      setCo2(latestData.co2);
      setPm25(latestData.pm25);
      setTemp(latestData.temp);
      setHumidity(latestData.humidity);
      setPm25Data((prev) => [...prev.slice(-9), latestData.pm25]);
      console.log("📊 Updated UI:", latestData);
    }, 10000);

    return () => {
      clearInterval(interval);
      client.end();
    };
  }, []);

  const chartData = {
    labels: Array.from({ length: pm25Data.length }, (_, i) => i + 1),
    datasets: [
      {
        label: "PM2.5 (µg/m³)",
        data: pm25Data,
        borderColor: "rgba(75,192,192,1)",
        fill: false,
      },
    ],
  };
  const DashboardCard = ({ title, value, icon, status }) => (
    <div
      className={`bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg 
      ${
        status === "warning"
          ? "border-l-4 border-red-500"
          : "border-l-4 border-green-500"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
      {status === "warning" && (
        <p className="text-xs text-red-500 mt-2">⚠️ Above recommended levels</p>
      )}
    </div>
  );
  const SensorCard = ({ title, value, icon, isWarning }) => (
    <div
      className={`bg-white p-6 rounded-2xl shadow-md border-l-8 transition-all duration-300 ${
        isWarning ? "border-red-500" : "border-blue-500"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p
            className={`text-3xl font-bold ${
              isWarning ? "text-red-600" : "text-gray-800"
            }`}
          >
            {value}
          </p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
      {isWarning && (
        <p className="text-xs text-red-500 mt-3 text-center">
          ⚠️ High level detected
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8">
      {/* Header Section - Centered */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-800">
          EnviroScan <span className="text-blue-600">Dashboard</span>
        </h1>
        {/* <h1 className="text-3xl font-bold text-primary">Hello Tailwind!</h1> */}
        <div className="flex justify-center items-center mt-2">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              connectionStatus === "Connected" ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <p
            className={`font-medium ${
              connectionStatus === "Connected"
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            Status: {connectionStatus}
          </p>
        </div>
      </header>

      {/* Main Content - Centered Grid */}
      <div className="flex flex-col items-center space-y-10">
        {/* Sensor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          <SensorCard
            title="CO₂"
            value={`${co2} ppm`}
            icon="🌿"
            isWarning={co2 > 1000}
          />
          <SensorCard
            title="PM2.5"
            value={`${pm25} µg/m³`}
            icon="💨"
            isWarning={pm25 > 12}
          />
          <SensorCard
            title="Temperature"
            value={`${temp} °C`}
            icon="🌡️"
            isWarning={temp > 30}
          />
          <SensorCard
            title="Humidity"
            value={`${humidity} %`}
            icon="💧"
            isWarning={humidity > 70}
          />
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl p-6 shadow-md w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-gray-700 mb-5 text-center">
            Environmental Data Trends
          </h2>
          <div className="h-80">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Last Updated */}
        <p className="text-sm text-gray-500 text-center">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );

  // Reusable Sensor Card Component
};

export default App;
