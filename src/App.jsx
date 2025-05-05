/* global mqtt */
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import mqtt from 'mqtt';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const App = () => {
  const [co2, setCo2] = useState(0);
  const [pm25, setPm25] = useState(0);
  const [temp, setTemp] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [fan, setFan] = useState(0);
  const [pm25Data, setPm25Data] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  useEffect(() => {
    console.log('App mounted');

    const options = {
      host: process.env.REACT_APP_MQTT_HOST || '4547d51320d54e74be02bb04e3c1b342.s1.eu.hivemq.cloud',
      port: 8884,
      protocol: 'wss',
      path: '/mqtt',
      username: process.env.REACT_APP_MQTT_USERNAME || 'envscan',
      password: process.env.REACT_APP_MQTT_PASSWORD || 'Abcd1234',
      clientId: 'WebApp_EnviroScan_' + Math.random().toString(16).slice(3),
      reconnectPeriod: 1000,
      connectTimeout: 30000,
    };

    const connectUrl = `wss://${options.host}:${options.port}${options.path}`;
    console.log('Connecting to:', connectUrl);

    const client = mqtt.connect(connectUrl, options);

    const latestData = {
      co2: 0,
      pm25: 0,
      temp: 0,
      humidity: 0,
      fan: 0,
    };

    client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker');
      setConnectionStatus('Connected');
      client.subscribe([
        'enviroscan/co2',
        'enviroscan/pm25',
        'enviroscan/temp',
        'enviroscan/humidity',
        'enviroscan/fan',
      ], (err) => {
        if (err) {
          console.error('Subscription error:', err);
          setConnectionStatus('Subscription failed');
        } else {
          console.log('📡 Subscribed to topics');
        }
      });
    });

    client.on('message', (topic, message) => {
      const value = message.toString();
      console.log(`📥 ${topic}: ${value}`);

      switch (topic) {
        case 'enviroscan/co2':
          latestData.co2 = parseFloat(value);
          break;
        case 'enviroscan/pm25':
          latestData.pm25 = parseFloat(value);
          break;
        case 'enviroscan/temp':
          latestData.temp = parseFloat(value);
          break;
        case 'enviroscan/humidity':
          latestData.humidity = parseFloat(value);
          break;
        case 'enviroscan/fan':
          latestData.humidity = parseFloat(value);
          break;  
        default:
          break;
      }
    });

    client.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
      setConnectionStatus('Error: ' + err.message);
    });

    client.on('reconnect', () => {
      console.log('🔄 Reconnecting...');
      setConnectionStatus('Reconnecting...');
    });

    client.on('close', () => {
      console.log('❌ Disconnected');
      setConnectionStatus('Disconnected');
    });

    // UI update every 10 seconds
    const interval = setInterval(() => {
      setCo2(latestData.co2);
      setPm25(latestData.pm25);
      setTemp(latestData.temp);
      setHumidity(latestData.humidity);
      setPm25Data((prev) => [...prev.slice(-9), latestData.pm25]);
      console.log('📊 Updated UI:', latestData);
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
        label: 'PM2.5 (µg/m³)',
        data: pm25Data,
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
  <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 mx-4">
    <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4 flex items-center justify-center gap-2">🌱 EnviroScan Dashboard</h1>
    <p className={`text-center text-sm font-medium mb-6 ${connectionStatus === 'Connected' ? 'text-green-500' : 'text-red-500'}`}>🔌 Connection Status: {connectionStatus}</p>

    <div className="card bg-white rounded-xl shadow-lg p-4">
      <table className="w-full text-center border-separate border-spacing-y-2">
        <thead>
          <tr>
            <th className="text-sm font-semibold text-gray-600 py-2 px-4">Icons</th>
            <th className="text-sm font-semibold text-gray-600 py-2 px-4">Sensor</th>
            <th className="text-sm font-semibold text-gray-600 py-2 px-4">Value</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "CO2", value: `${co2} ppm`, icon: "https://img.icons8.com/color/48/air-quality.png", bg: "bg-blue-50" },
            { name: "PM2.5", value: `${pm25} µg/m³`, icon: "https://img.icons8.com/color/48/dust.png", bg: "bg-gray-50" },
            { name: "Temperature", value: `${temp} °C`, icon: "https://img.icons8.com/color/48/temperature--v1.png", bg: "bg-red-50" },
            { name: "Humidity", value: `${humidity} %`, icon: "https://img.icons8.com/color/48/hygrometer.png", bg: "bg-blue-100" },
            { name: "Fan", value: fan === 1 ? "On" : "Off", icon: "https://img.icons8.com/color/48/fan.png", bg: "bg-gray-100" },
          ].map((sensor, idx) => (
            <tr key={idx} className={`${sensor.bg} rounded-lg hover:bg-opacity-80 transition`}>
              <td className="py-2 px-4"><img src={sensor.icon} alt={sensor.name} className="w-6 h-6 mx-auto" /></td>
              <td className="py-2 px-4 text-sm font-medium text-gray-700">{sensor.name}</td>
              <td className="py-2 px-4 text-sm font-medium text-gray-700">{sensor.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-6">
      <h2 className="text-lg font-semibold text-center text-gray-800 mb-10 flex justify-center items-center gap-2">📊 PM2.5 Trend</h2>
      <div className="max-w-md mx-auto" style={{ width: "500px" }}><Line data={chartData} /></div>
    </div>
  </div>
</div>
  );
};

export default App;
