const { useState, useEffect } = React;

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('class'); // 'class' ou 'teacher'
  const [timeInput, setTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [teacherInput, setTeacherInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Lista de turmas
  const classes = [
    '6º ANO TURMA A', '6º ANO TURMA B', '7º ANO TURMA A', '7º ANO TURMA B',
    '8º ANO TURMA A', '8º ANO TURMA B', '8º ANO TURMA C', '9º ANO TURMA A', '9º ANO TURMA B',
    '1º SERIE -A', '1º SERIE -B', '2º ADM', '2º SERIE -B LGH', '3º SERIE A CNT',
    '3º SERIE B LGH', '3º VENDAS'
  ];

  // Preencher horário com hora local
  useEffect(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setTimeInput(`${hours}:${minutes}`);
  }, []);

  // Carregar CSV de terça-feira
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('data/tuesday.csv');
        if (!response.ok) throw new Error('Falha ao carregar o arquivo');
        const csv = await response.text();
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().replace(/^"|"$/g, ''),
          transform: (value) => value.trim().replace(/^"|"$/g, ''),
          complete: (results) => {
            setData(results.data);
            setLoading(false);
          },
          error: (err) => {
            console.error(err);
            setError('Erro ao carregar os dados do horário.');
            setLoading(false);
          }
        });
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar os dados do horário.');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Normalizar horário digitado
  const normalizeTime = (input) => {
    if (!input) return null;
    const cleaned = input.replace(/[^0-9:]/g, '');
    const match = cleaned.match(/^(\d{1,2})(?::?(\d{2}))?$/);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    if (hours < 0 || hours > 23 || minutes > 59) return null;

    const timeSlots = [
      { start: '7:00', slot: '7h00 - 7h50', startMinutes: 7 * 60 },
      { start: '7:50', slot: '7h50 - 8h40', startMinutes: 7 * 60 + 50 },
      { start: '8:40', slot: '8h40-9h00', startMinutes: 8 * 60 + 40, isBreak: true, label: 'Café' },
      { start: '9:00', slot: '9h00 - 9h50', startMinutes: 9 * 60 },
      { start: '9:50', slot: '9h50 - 10h40', startMinutes: 9 * 60 + 50 },
      { start: '10:40', slot: '10h40-11h30', startMinutes: 10 * 60 + 40 },
      { start: '11:30', slot: '11h30-12h30', startMinutes: 11 * 60 + 30, isBreak: true, label: 'Almoço' },
      { start: '12:30', slot: '12h30-13h20', startMinutes: 12 * 60 + 30 },
      { start: '13:20', slot: '13h20-14h10', startMinutes: 13 * 60 + 20 },
      { start: '14:10', slot: '14h10-14h20', startMinutes: 14 * 60 + 10, isBreak: true, label: 'Lanche' },
      { start: '14:20', slot: '14h20-15h10', startMinutes: 14 * 60 + 20 },
      { start: '15:10', slot: '15h10-16h00', startMinutes: 15 * 60 + 10 },
      { start: '8:40', slot: '8h40-9h30', startMinutes: 8 * 60 + 40 },
      { start: '9:30', slot: '9h30-10h20', startMinutes: 9 * 60 + 30 },
      { start: '10:20', slot: '10h20-10h50', startMinutes: 10 * 60 + 20, isBreak: true, label: 'Café' },
      { start: '10:50', slot: '10h50 - 11h40', startMinutes: 10 * 60 + 50 },
      { start: '11:40', slot: '11h40-12h30', startMinutes: 11 * 60 + 40 },
      { start: '12:30', slot: '12h30-13h30', startMinutes: 12 * 60 + 30, isBreak: true, label: 'Almoço' },
      { start: '13:30', slot: '13h30 - 14h20', startMinutes: 13 * 60 + 30 },
      { start: '14:20', slot: '14h20-15h10', startMinutes: 14 * 60 + 20 },
      { start: '15:10', slot: '15h10-15h50', startMinutes: 15 * 60 + 10 },
      { start: '15:50', slot: '15H50-16H00', startMinutes: 15 * 60 + 50, isBreak: true, label: 'Lanche' }
    ];

    const inputMinutes = hours * 60 + minutes;
    for (const slot of timeSlots) {
      const slotStartMinutes = slot.startMinutes;
      const nextSlot = timeSlots.find(s => s.startMinutes > slot.startMinutes) || { startMinutes: 16 * 60 };
      const slotEndMinutes = nextSlot.startMinutes;

      if (inputMinutes >= slotStartMinutes && inputMinutes < slotEndMinutes) {
        return slot;
      }
    }
    return null;
  };

  // Converter horário para minutos totais
  const timeToMinutes = (input) => {
    const cleaned = input.replace(/[^0-9:]/g, '');
    const match = cleaned.match(/^(\d{1,2})(?::?(\d{2}))?$/);
    if (!match) return null;
    const hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    return hours * 60 + minutes;
  };

  // Lidar com o envio do formulário
  const handleSubmit = (e) => {
    e.preventDefault();
    setResult(null);
    setError('');

    if (searchType === 'class') {
      if (!timeInput || !endTimeInput || !selectedClass) {
        setError('Por favor, preencha o horário inicial, final e a turma.');
        return;
      }

      const startSlot = normalizeTime(timeInput);
      const endSlot = normalizeTime(endTimeInput);

      if (!startSlot || !endSlot) {
        setError('Formato de horário inválido. Use HH:MM (ex.: 9:30).');
        return;
      }

      const startMinutes = timeToMinutes(timeInput);
      const endMinutes = timeToMinutes(endTimeInput);

      if (startMinutes >= endMinutes) {
        setError('O horário final deve ser após o inicial.');
        return;
      }

      const filteredEntries = data
        .filter(row => row['class'] === selectedClass)
        .filter(row => {
          const slot = timeSlots.find(s => s.slot === row['time']);
          if (!slot) return false;
          const slotMinutes = slot.startMinutes;
          return slotMinutes >= startSlot.startMinutes && slotMinutes <= endSlot.startMinutes;
        })
        .sort((a, b) => {
          const slotA = timeSlots.find(s => s.slot === a['time']).startMinutes;
          const slotB = timeSlots.find(s => s.slot === b['time']).startMinutes;
          return slotA - slotB;
        });

      if (filteredEntries.length > 0) {
        setResult({ type: 'classList', entries: filteredEntries });
      } else {
        setResult({ type: 'none', message: 'Nenhuma aula encontrada no intervalo.' });
      }
    } else if (searchType === 'teacher') {
      if (!timeInput || !teacherInput) {
        setError('Por favor, preencha o horário e o nome do professor.');
        return;
      }

      const timeSlot = normalizeTime(timeInput);
      if (!timeSlot) {
        setError('Formato de horário inválido. Use HH:MM (ex.: 9:30).');
        return;
      }

      if (timeSlot.isBreak) {
        setResult({ type: 'break', message: `Pausa: ${timeSlot.label}` });
        return;
      }

      const filteredEntries = data.filter(row =>
        row['time'] === timeSlot.slot &&
        row['teacher'].toLowerCase().includes(teacherInput.toLowerCase())
      );

      if (filteredEntries.length > 0) {
        setResult({ type: 'teacherList', entries: filteredEntries });
      } else {
        setResult({ type: 'none', message: 'Nenhum professor encontrado neste horário.' });
      }
    }
  };

  return (
    <div className="container">
      <h1>Consulta de Horários Escolares - Terça-feira</h1>
      <div className="form-group">
        <label>Tipo de Busca</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="class"
              checked={searchType === 'class'}
              onChange={() => setSearchType('class')}
            />
            Por Turma e Intervalo
          </label>
          <label>
            <input
              type="radio"
              value="teacher"
              checked={searchType === 'teacher'}
              onChange={() => setSearchType('teacher')}
            />
            Por Professor e Horário
          </label>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        {searchType === 'class' ? (
          <>
            <div className="form-group">
              <label>Horário Inicial (ex.: 7:00)</label>
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Horário Final (ex.: 12:00)</label>
              <input
                type="time"
                value={endTimeInput}
                onChange={(e) => setEndTimeInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Turma</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
              >
                <option value="">Selecione uma turma</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Horário (ex.: 9:30)</label>
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Nome do Professor</label>
              <input
                type="text"
                value={teacherInput}
                onChange={(e) => setTeacherInput(e.target.value)}
                placeholder="Digite o nome do professor"
                required
              />
            </div>
          </>
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Carregando...' : 'Consultar'}
        </button>
      </form>
      {error && (
        <div className="error">
          {error}
        </div>
      )}
      {result && (
        <div className="result">
          {result.type === 'classList' ? (
            <div>
              <h3>Aulas no intervalo:</h3>
              <ul>
                {result.entries.map((entry, index) => (
                  <li key={index}>
                    {entry.time}: {entry.subject}{entry.teacher ? ` / ${entry.teacher}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : result.type === 'teacherList' ? (
            <div>
              <h3>Aulas do professor:</h3>
              <ul>
                {result.entries.map((entry, index) => (
                  <li key={index}>
                    {entry.time}: {entry.class}, {entry.subject}
                  </li>
                ))}
              </ul>
            </div>
          ) : result.type === 'break' ? (
            <p>{result.message}</p>
          ) : (
            <p>{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

const timeSlots = [
  { start: '7:00', slot: '7h00 - 7h50', startMinutes: 7 * 60 },
  { start: '7:50', slot: '7h50 - 8h40', startMinutes: 7 * 60 + 50 },
  { start: '8:40', slot: '8h40-9h00', startMinutes: 8 * 60 + 40, isBreak: true, label: 'Café' },
  { start: '9:00', slot: '9h00 - 9h50', startMinutes: 9 * 60 },
  { start: '9:50', slot: '9h50 - 10h40', startMinutes: 9 * 60 + 50 },
  { start: '10:40', slot: '10h40-11h30', startMinutes: 10 * 60 + 40 },
  { start: '11:30', slot: '11h30-12h30', startMinutes: 11 * 60 + 30, isBreak: true, label: 'Almoço' },
  { start: '12:30', slot: '12h30-13h20', startMinutes: 12 * 60 + 30 },
  { start: '13:20', slot: '13h20-14h10', startMinutes: 13 * 60 + 20 },
  { start: '14:10', slot: '14h10-14h20', startMinutes: 14 * 60 + 10, isBreak: true, label: 'Lanche' },
  { start: '14:20', slot: '14h20-15h10', startMinutes: 14 * 60 + 20 },
  { start: '15:10', slot: '15h10-16h00', startMinutes: 15 * 60 + 10 },
  { start: '8:40', slot: '8h40-9h30', startMinutes: 8 * 60 + 40 },
  { start: '9:30', slot: '9h30-10h20', startMinutes: 9 * 60 + 30 },
  { start: '10:20', slot: '10h20-10h50', startMinutes: 10 * 60 + 20, isBreak: true, label: 'Café' },
  { start: '10:50', slot: '10h50 - 11h40', startMinutes: 10 * 60 + 50 },
  { start: '11:40', slot: '11h40-12h30', startMinutes: 11 * 60 + 40 },
  { start: '12:30', slot: '12h30-13h30', startMinutes: 12 * 60 + 30, isBreak: true, label: 'Almoço' },
  { start: '13:30', slot: '13h30 - 14h20', startMinutes: 13 * 60 + 30 },
  { start: '14:20', slot: '14h20-15h10', startMinutes: 14 * 60 + 20 },
  { start: '15:10', slot: '15h10-15h50', startMinutes: 15 * 60 + 10 },
  { start: '15:50', slot: '15H50-16H00', startMinutes: 15 * 60 + 50, isBreak: true, label: 'Lanche' }
];

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);