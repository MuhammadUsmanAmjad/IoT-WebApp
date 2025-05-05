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
    };

    client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker');
      setConnectionStatus('Connected');
      client.subscribe([
        'enviroscan/co2',
        'enviroscan/pm25',
        'enviroscan/temp',
        'enviroscan/humidity',
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
    <div className="p-4">
      <h1 className="text-2xl font-bold">EnviroScan Dashboard</h1>
      <p className={connectionStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}>
        Connection Status: {connectionStatus}
      </p>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <p>CO2: {co2} ppm</p>
        <p>PM2.5: {pm25} µg/m³</p>
        <p>Temperature: {temp} °C</p>
        <p>Humidity: {humidity} %</p>
      </div>
      <div className="mt-4" style={{ width: '500px' }}>
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default App;
