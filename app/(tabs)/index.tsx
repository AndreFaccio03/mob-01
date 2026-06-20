import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, Alert, LogBox, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const obterDataDeHoje = () => {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

export default function App() {
  const [habitos, setHabitos] = useState([]);
  const [textoNovoHabito, setTextoNovoHabito] = useState('');
  const [horario, setHorario] = useState(''); // Armazena a string "HH:MM" ou vazia
  const [meta, setMeta] = useState('');
  const [isDiario, setIsDiario] = useState(true);
  const [dadosHora, setDadosHora] = useState(new Date());
  const [mostrarPicker, setMostrarPicker] = useState(false);

  useEffect(() => {
    carregarHabitos();
    configurarNotificacoes();
  }, []);

  const configurarNotificacoes = async () => {
    const { status: statusExistente } = await Notifications.getPermissionsAsync();
    let statusFinal = statusExistente;

    if (statusExistente !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      statusFinal = status;
    }

    if (statusFinal !== 'granted') {
      Alert.alert('Aviso', 'Sem permissão, você não receberá lembretes.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Padrão',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  const carregarHabitos = async () => {
    try {
      const dadosSalvos = await AsyncStorage.getItem('@meus_habitos');
      if (dadosSalvos !== null) {
        setHabitos(JSON.parse(dadosSalvos));
      }
    } catch (erro) {
      console.error('Erro ao carregar os hábitos:', erro);
    }
  };

  const salvarHabitos = async (novaLista) => {
    try {
      await AsyncStorage.setItem('@meus_habitos', JSON.stringify(novaLista));
    } catch (erro) {
      console.error('Erro ao salvar os hábitos:', erro);
    }
  };

const agendarNotificacao = async (nome, horarioStr) => {
    if (!horarioStr) return null;
    const [hora, minuto] = horarioStr.split(':').map(Number);

    const idNotificacao = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora do seu Hábito! 💪',
        body: `Não se esqueça de: ${nome}`,
        // Se precisar forçar o canal no Android futuro, o ideal é colocar o channelId no content, não no trigger!
      },
      trigger: {
        type: 'daily', // Diz explicitamente ao Expo que é um agendamento com base na hora do dia
        hour: hora,
        minute: minuto,
      },
    });

    return idNotificacao;
  };

  const aoMudarHora = (event, dataSelecionada) => {
    setMostrarPicker(Platform.OS === 'ios'); // Mantém aberto no iOS para confirmação fluida
    if (dataSelecionada) {
      setDadosHora(dataSelecionada);
      const horas = String(dataSelecionada.getHours()).padStart(2, '0');
      const minutos = String(dataSelecionada.getMinutes()).padStart(2, '0');
      setHorario(`${horas}:${minutos}`);
    }
  };

  const adicionarHabito = async () => {
    if (textoNovoHabito.trim() === '') {
      Alert.alert('Aviso', 'O nome do hábito é obrigatório.');
      return;
    }

    let idNotificacao = null;
    // Só agenda se o usuário escolheu um horário
    if (horario) {
      idNotificacao = await agendarNotificacao(textoNovoHabito, horario);
    }

    const novo = {
      id: Date.now().toString(),
      nome: textoNovoHabito,
      horario: horario || 'Sem horário',
      meta: meta.trim() || 'Sem meta',
      frequencia: isDiario ? 'diária' : 'semanal',
      idNotificacao: idNotificacao,
      historico: [], 
    };

    const novaLista = [...habitos, novo];
    setHabitos(novaLista);
    await salvarHabitos(novaLista);

    setTextoNovoHabito('');
    setHorario('');
    setMeta('');
  };

  const alternarHabito = (id) => {
    const hoje = obterDataDeHoje();
    const novaLista = habitos.map((habito) => {
      if (habito.id === id) {
        const historicoAtual = habito.historico || [];
        const jaFeitoHoje = historicoAtual.includes(hoje);
        
        const novoHistorico = jaFeitoHoje
          ? historicoAtual.filter((data) => data !== hoje)
          : [...historicoAtual, hoje];

        return { ...habito, historico: novoHistorico };
      }
      return habito;
    });
    
    setHabitos(novaLista);
    salvarHabitos(novaLista);
  };

  const removerHabito = async (id) => {
    const habitoParaRemover = habitos.find((h) => h.id === id);
    
    if (habitoParaRemover?.idNotificacao) {
      await Notifications.cancelScheduledNotificationAsync(habitoParaRemover.idNotificacao);
    }

    const novaLista = habitos.filter((habito) => habito.id !== id);
    setHabitos(novaLista);
    salvarHabitos(novaLista);
  };

  const renderizarItem = ({ item }) => {
    const hoje = obterDataDeHoje();
    const feitoHoje = item.historico?.includes(hoje);

    return (
      <View style={[styles.item, feitoHoje && styles.itemFeito]}>
        <TouchableOpacity style={styles.areaTexto} onPress={() => alternarHabito(item.id)}>
          <Text style={[styles.textoItem, feitoHoje && styles.textoFeito]}>
            {item.nome}
          </Text>
          <Text style={styles.textoDetalhe}>
            {item.frequencia}
            {item.horario !== 'Sem horário' ? ` às ${item.horario}` : ''}
            {item.meta !== 'Sem meta' ? ` | Meta: ${item.meta}` : ''}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.acoesContainer}>
          <TouchableOpacity onPress={() => alternarHabito(item.id)}>
            <Text style={styles.statusTexto}>
              {feitoHoje ? '✅' : '⭕'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.botaoExcluir} onPress={() => removerHabito(item.id)}>
            <Text style={styles.textoLixeira}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Hábitos de Hoje</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome do hábito..."
          placeholderTextColor="#888"
          value={textoNovoHabito}
          onChangeText={setTextoNovoHabito}
        />
        
        <View style={styles.linhaInput}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <TouchableOpacity 
              style={styles.botaoPicker} 
              onPress={() => setMostrarPicker(true)}
            >
              <Text style={styles.textoBotaoPicker}>
                {horario ? `⏰ ${horario}` : '🔔 Lembrar (opcional)'}
              </Text>
            </TouchableOpacity>
            {horario ? (
              <TouchableOpacity style={styles.botaoLimparHora} onPress={() => setHorario('')}>
                <Text style={styles.textoLimparHora}>Remover hora</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 5 }]}
            placeholder="Meta (ex: 2L) - Opcional"
            placeholderTextColor="#888"
            value={meta}
            onChangeText={setMeta}
          />
        </View>

        <View style={styles.seletorContainer}>
          <TouchableOpacity 
            style={[styles.botaoSeletor, isDiario && styles.botaoSeletorAtivo]}
            onPress={() => setIsDiario(true)}
          >
            <Text style={[styles.textoSeletor, isDiario && styles.textoSeletorAtivo]}>Diário</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.botaoSeletor, !isDiario && styles.botaoSeletorAtivo]}
            onPress={() => setIsDiario(false)}
          >
            <Text style={[styles.textoSeletor, !isDiario && styles.textoSeletorAtivo]}>Semanal</Text>
          </TouchableOpacity>
        </View>

        {mostrarPicker && (
          <DateTimePicker
            value={dadosHora}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
            onChange={aoMudarHora}
          />
        )}

        <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionarHabito}>
          <Text style={styles.textoBotao}>Adicionar Hábito</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={habitos}
        keyExtractor={(item) => item.id}
        renderItem={renderizarItem}
        contentContainerStyle={{ gap: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingTop: 60, paddingHorizontal: 20 },
  titulo: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  formContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, elevation: 2, marginBottom: 20 },
  linhaInput: { flexDirection: 'row', marginTop: 10, alignItems: 'flex-start' },
  input: { backgroundColor: '#F9F9F9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#EEE' },
  botaoPicker: { backgroundColor: '#F9F9F9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center' },
  textoBotaoPicker: { fontSize: 14, color: '#555' },
  botaoLimparHora: { marginTop: 5, alignItems: 'center' },
  textoLimparHora: { fontSize: 11, color: '#FF3B30', fontWeight: '600' },
  seletorContainer: { flexDirection: 'row', backgroundColor: '#E0E0E0', borderRadius: 10, marginTop: 15, marginBottom: 15, padding: 4 },
  botaoSeletor: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  botaoSeletorAtivo: { backgroundColor: '#FFF', elevation: 2 },
  textoSeletor: { fontSize: 16, color: '#666', fontWeight: '600' },
  textoSeletorAtivo: { color: '#007AFF' },
  botaoAdicionar: { backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
  textoBotao: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, elevation: 1 },
  itemFeito: { backgroundColor: '#E8F5E9' },
  areaTexto: { flex: 1 },
  textoItem: { fontSize: 18, color: '#333', fontWeight: '500' },
  textoDetalhe: { fontSize: 12, color: '#777', marginTop: 4 },
  textoFeito: { textDecorationLine: 'line-through', color: '#9e9e9e' },
  acoesContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  statusTexto: { fontSize: 24 },
  botaoExcluir: { padding: 5 },
  textoLixeira: { fontSize: 20 }
});