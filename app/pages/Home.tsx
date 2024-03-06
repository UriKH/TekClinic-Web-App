import React, { useContext } from 'react';
import { Title, Button } from '@mantine/core';
import { AuthContext } from "../context/AuthContextProvider";
import { useEffect, useState } from "react";
import { PatientResponse, DoctorResponse, AppointmentResponse, EndpointResponse, fetchEndpointResponse, fetchPatientList, fetchDoctorList, fetchAppointmentList } from "../apiCalls";
import PatientTable from '../components/PatientTable';
import DoctorTable from '../components/DoctorTable';
import AppointmentTable from '../components/AppointmentTable';

export default function Home() {
  const authContext = useContext(AuthContext);
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [patientEndpointResponse, setPatientEndpointResponse] = useState<EndpointResponse | null>(null);
  const [patientList, setPatientList] = useState<PatientResponse[]>([]);

  const [doctorEndpointResponse, setDoctorEndpointResponse] = useState<EndpointResponse | null>(null);
  const [doctorList, setDoctorList] = useState<DoctorResponse[]>([]);
  
  const [appointmentEndpointResponse, setAppointmentEndpointResponse] = useState<EndpointResponse | null>(null);
  const [appointmentList, setAppointmentList] = useState<AppointmentResponse[]>([]);

  const [activeTable, setActiveTable] = useState('patient');
  //console.log(authContext.keycloakToken);
  const limit = 20;
  const offset = 0;

  useEffect(() => {
    if (authContext.isAuthenticated && authContext.keycloakToken && authContext.username) {
      setUsername(authContext.username);
    }
    const fetchEndpointData = async () => {
      try {
        const patientEndpointData = await fetchEndpointResponse("patient", limit, offset, authContext, setError);
        console.log(patientEndpointData);
        setPatientEndpointResponse(patientEndpointData);
        
        const doctorEndpointData = await fetchEndpointResponse("doctor", limit, offset, authContext, setError);
        console.log(doctorEndpointData);
        setDoctorEndpointResponse(doctorEndpointData);
        
        const appointmentEndpointData = await fetchEndpointResponse("appointment", limit, offset, authContext, setError);
        console.log(appointmentEndpointData);
        setAppointmentEndpointResponse(appointmentEndpointData);
      } catch (error) {
        console.error('Error occurred:', error);
        console.error('Logging out...', error);
        authContext.logout();
      }
    };
    fetchEndpointData();
  }, [authContext.isAuthenticated, authContext.keycloakToken, authContext.username]);

  return (
    <div>
      <Title>Hello, {username}</Title>
      <Button onClick={authContext.logout}>Logout</Button>
    </div>
  );
}