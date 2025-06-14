import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, UserCheck, Shield, Plus, X, Eye, Trash2, LogOut, Menu } from 'lucide-react';

// Componente principal
const MedicalAppointmentSystem = () => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para datos
  const [specialties, setSpecialties] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  // Configuración de la API base
  const API_BASE = '';

  // Función para hacer peticiones autenticadas
  const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Función para hacer consultas GraphQL
  const graphqlRequest = async (query, variables = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/specialties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    return result.data;
  };

  // Verificar token al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUserProfile();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await apiRequest(`${API_BASE}/auth/profile`);
      setUser(profile);
      setCurrentView('dashboard');
      loadInitialData(profile.role);
    } catch (error) {
      localStorage.removeItem('token');
      setMessage('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
  };

  const loadInitialData = async (role) => {
    try {
      // Cargar especialidades
      const specialtiesQuery = `
        query {
          getSpecialties {
            _id
            name
          }
        }
      `;
      const specialtiesData = await graphqlRequest(specialtiesQuery);
      setSpecialties(specialtiesData.getSpecialties || []);

      // Cargar citas según el rol
      if (role === 'paciente') {
        const userAppointments = await apiRequest(`${API_BASE}/appointments/patient/${user?.id}`);
        setAppointments(userAppointments || []);
      } else if (role === 'medico') {
        const doctorAppointments = await apiRequest(`${API_BASE}/appointments/doctor/${user?.id}`);
        setAppointments(doctorAppointments || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Componente de Login
  const LoginForm = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage('');

      try {
        const endpoint = isRegister ? '/auth/register' : '/auth/login';
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error en la autenticación');
        }

        if (isRegister) {
          setMessage('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
          setIsRegister(false);
        } else {
          localStorage.setItem('token', data.token);
          setUser(data.user);
          setCurrentView('dashboard');
          loadInitialData(data.user.role);
        }
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isRegister ? 'Registro' : 'Iniciar Sesión'}
            </h1>
            <p className="text-gray-600 mt-2">Sistema de Reservas Médicas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa tu usuario"
              />
            </div>

            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    required
                    value={formData.role || 'paciente'}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="paciente">Paciente</option>
                    <option value="medico">Médico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Procesando...' : (isRegister ? 'Registrarse' : 'Iniciar Sesión')}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('exitosamente') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isRegister ? '¿Ya tienes cuenta? Iniciar Sesión' : '¿No tienes cuenta? Registrarse'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente Sidebar
  const Sidebar = () => {
    const menuItems = {
      paciente: [
        { id: 'dashboard', label: 'Dashboard', icon: User },
        { id: 'appointments', label: 'Mis Citas', icon: Calendar },
        { id: 'book', label: 'Reservar Cita', icon: Plus }
      ],
      medico: [
        { id: 'dashboard', label: 'Dashboard', icon: User },
        { id: 'appointments', label: 'Mis Citas', icon: Calendar },
        { id: 'schedule', label: 'Mi Agenda', icon: Clock }
      ],
      admin: [
        { id: 'dashboard', label: 'Dashboard', icon: Shield },
        { id: 'specialties', label: 'Especialidades', icon: Plus },
        { id: 'appointments', label: 'Todas las Citas', icon: Calendar }
      ]
    };

    const items = menuItems[user?.role] || [];

    return (
      <div className={`bg-white shadow-lg h-full transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:relative z-30 w-64`}>
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.username}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              setUser(null);
              setCurrentView('login');
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    );
  };

  // Componente Dashboard
  const Dashboard = () => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Buenos días';
      if (hour < 18) return 'Buenas tardes';
      return 'Buenas noches';
    };

    const stats = {
      paciente: [
        { label: 'Citas Programadas', value: appointments.filter(a => a.status === 'confirmed').length, icon: Calendar },
        { label: 'Especialidades Disponibles', value: specialties.length, icon: User }
      ],
      medico: [
        { label: 'Citas Hoy', value: appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length, icon: Calendar },
        { label: 'Total Citas', value: appointments.length, icon: User }
      ],
      admin: [
        { label: 'Especialidades', value: specialties.length, icon: Shield },
        { label: 'Sistema Activo', value: '✓', icon: UserCheck }
      ]
    };

    const currentStats = stats[user?.role] || [];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {getGreeting()}, {user?.username}
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido a tu panel de {user?.role}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {appointments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximas Citas</h3>
            <div className="space-y-3">
              {appointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800">
                        {new Date(appointment.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">{appointment.time}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente para reservar citas (Pacientes)
  const BookAppointment = () => {
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [step, setStep] = useState(1);

    const handleBooking = async () => {
      if (!selectedSlot || !selectedDate) {
        setMessage('Por favor completa todos los campos');
        return;
      }

      setLoading(true);
      try {
        await apiRequest(`${API_BASE}/appointments`, {
          method: 'POST',
          body: JSON.stringify({
            doctor_id: parseInt(selectedDoctor),
            date: selectedDate,
            time: selectedSlot
          })
        });

        setMessage('Cita reservada exitosamente');
        setStep(1);
        setSelectedSpecialty('');
        setSelectedDoctor('');
        setSelectedSlot('');
        setSelectedDate('');
      } catch (error) {
        setMessage('Error al reservar la cita: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const loadAvailability = async () => {
      if (!selectedDoctor || !selectedDate) return;

      try {
        const query = `
          query GetDoctorAvailability($doctorId: Int!, $date: String!) {
            getDoctorAvailability(doctorId: $doctorId, date: $date) {
              time_slots
            }
          }
        `;
        const data = await graphqlRequest(query, {
          doctorId: parseInt(selectedDoctor),
          date: selectedDate
        });
        setAvailableSlots(data.getDoctorAvailability?.time_slots || []);
      } catch (error) {
        console.error('Error loading availability:', error);
        setAvailableSlots([]);
      }
    };

    useEffect(() => {
      if (selectedDoctor && selectedDate) {
        loadAvailability();
      }
    }, [selectedDoctor, selectedDate]);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reservar Nueva Cita</h2>
          <p className="text-gray-600 mt-2">Sigue los pasos para agendar tu cita médica</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && <div className={`w-12 h-1 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Paso 1: Selecciona la especialidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialties.map((specialty) => (
                  <button
                    key={specialty._id}
                    onClick={() => {
                      setSelectedSpecialty(specialty._id);
                      setStep(2);
                    }}
                    className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-800">{specialty.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Paso 2: Selecciona fecha y médico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Médico</label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar médico</option>
                    <option value="1">Dr. García</option>
                    <option value="2">Dra. López</option>
                    <option value="3">Dr. Martínez</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedDoctor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Paso 3: Selecciona horario</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableSlots.length > 0 ? availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      selectedSlot === slot
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {slot}
                  </button>
                )) : (
                  <div className="col-span-4 text-center text-gray-500 py-4">
                    No hay horarios disponibles para esta fecha
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Reservando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('exitosamente') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    );
  };

  // Componente Lista de Citas
  const AppointmentsList = () => {
    const cancelAppointment = async (appointmentId) => {
      if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) return;

      setLoading(true);
      try {
        await apiRequest(`${API_BASE}/appointments/${appointmentId}`, {
          method: 'DELETE'
        });
        setAppointments(appointments.filter(a => a.id !== appointmentId));
        setMessage('Cita cancelada exitosamente');
      } catch (error) {
        setMessage('Error al cancelar la cita: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {user?.role === 'paciente' ? 'Mis Citas' : user?.role === 'medico' ? 'Mis Citas como Médico' : 'Todas las Citas'}
          </h2>
          <p className="text-gray-600 mt-2">Gestiona tus citas médicas</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tienes citas programadas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {user?.role === 'paciente' ? 'Médico' : 'Paciente'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user?.role === 'paciente' ? `Dr. ID: ${appointment.doctor_id}` : `Paciente ID: ${appointment.patient_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => cancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Cancelar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('exitosamente') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    );
  };

  // Componente para Especialidades (Admin)
  const SpecialtiesManager = () => {
    const [newSpecialty, setNewSpecialty] = useState('');

    const addSpecialty = async () => {
      if (!newSpecialty.trim()) {
        setMessage('Por favor ingresa el nombre de la especialidad');
        return;
      }

      setLoading(true);
      try {
        const mutation = `
          mutation CreateSpecialty($name: String!) {
            createSpecialty(name: $name) {
              _id
              name
            }
          }
        `;
        const data = await graphqlRequest(mutation, { name: newSpecialty });
        setSpecialties([...specialties, data.createSpecialty]);
        setNewSpecialty('');
        setMessage('Especialidad agregada exitosamente');
      } catch (error) {
        setMessage('Error al agregar especialidad: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Especialidades</h2>
          <p className="text-gray-600 mt-2">Administra las especialidades médicas del sistema</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Agregar Nueva Especialidad</h3>
          <div className="flex space-x-3">
            <input
              type="text"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder="Nombre de la especialidad"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
            />
            <button
              onClick={addSpecialty}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Especialidades Registradas</h3>
          {specialties.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay especialidades registradas</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialties.map((specialty) => (
                <div key={specialty._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{specialty.name}</span>
                    <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('exitosamente') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    );
  };

  // Componente para Agenda (Médicos)
  const ScheduleManager = () => {
    const [scheduleDate, setScheduleDate] = useState('');
    const [timeSlots, setTimeSlots] = useState([]);
    const [newTimeSlot, setNewTimeSlot] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');

    const addTimeSlot = () => {
      if (!newTimeSlot) return;
      if (timeSlots.includes(newTimeSlot)) {
        setMessage('Este horario ya está agregado');
        return;
      }
      setTimeSlots([...timeSlots, newTimeSlot]);
      setNewTimeSlot('');
    };

    const removeTimeSlot = (slot) => {
      setTimeSlots(timeSlots.filter(s => s !== slot));
    };

    const saveSchedule = async () => {
      if (!scheduleDate || timeSlots.length === 0 || !selectedSpecialty) {
        setMessage('Por favor completa todos los campos');
        return;
      }

      setLoading(true);
      try {
        const mutation = `
          mutation SetDoctorSchedule($doctorId: Int!, $date: String!, $timeSlots: [String!]!, $specialtyId: String!) {
            setDoctorSchedule(doctorId: $doctorId, date: $date, timeSlots: $timeSlots, specialtyId: $specialtyId) {
              _id
              date
              time_slots
            }
          }
        `;
        await graphqlRequest(mutation, {
          doctorId: user.id,
          date: scheduleDate,
          timeSlots: timeSlots,
          specialtyId: selectedSpecialty
        });
        
        setMessage('Agenda guardada exitosamente');
        setScheduleDate('');
        setTimeSlots([]);
        setSelectedSpecialty('');
      } catch (error) {
        setMessage('Error al guardar agenda: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mi Agenda Médica</h2>
          <p className="text-gray-600 mt-2">Configura tus horarios de atención</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurar Horarios</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar especialidad</option>
                {specialties.map((specialty) => (
                  <option key={specialty._id} value={specialty._id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Agregar Horario</label>
            <div className="flex space-x-3">
              <input
                type="time"
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTimeSlot}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {timeSlots.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Horarios Agregados</h4>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((slot) => (
                  <div key={slot} className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    <span className="text-sm">{slot}</span>
                    <button
                      onClick={() => removeTimeSlot(slot)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={saveSchedule}
            disabled={loading || !scheduleDate || timeSlots.length === 0 || !selectedSpecialty}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Guardando...' : 'Guardar Agenda'}
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('exitosamente') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    );
  };

  // Componente principal con layout
  const MainLayout = () => {
    const renderContent = () => {
      switch (currentView) {
        case 'dashboard':
          return <Dashboard />;
        case 'appointments':
          return <AppointmentsList />;
        case 'book':
          return <BookAppointment />;
        case 'specialties':
          return <SpecialtiesManager />;
        case 'schedule':
          return <ScheduleManager />;
        default:
          return <Dashboard />;
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar />

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </header>

          {/* Contenido */}
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    );
  };

  // Render principal
  if (!user) {
    return <LoginForm />;
  }

  return <MainLayout />;
};

export default MedicalAppointmentSystem;