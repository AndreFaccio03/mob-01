import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, LogBox, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

// Fuso Horário Local Corrigido
const obterDataLocalSegura = (data) => {
  const tzOffset = data.getTimezoneOffset() * 60000;
  const localISOTime = new Date(data.getTime() - tzOffset).toISOString().slice(0, 10);
  return localISOTime;
};

const obterDataDeHoje = () => obterDataLocalSegura(new Date());

export default function MetricsScreen() {
  const [habitos, setHabitos] = useState([]);
  const [periodo, setPeriodo] = useState('semanal'); // 'semanal' ou 'mensal'

  useFocusEffect(
    useCallback(() => {
      carregarHabitos();
    }, [])
  );

  const carregarHabitos = async () => {
    try {
      const dadosSalvos = await AsyncStorage.getItem('@meus_habitos');
      if (dadosSalvos !== null) {
        setHabitos(JSON.parse(dadosSalvos));
      }
    } catch (erro) {
      console.error("Erro nas métricas:", erro);
    }
  };

  const totalHabitos = habitos.length;
  const hoje = obterDataDeHoje();
  const habitosConcluidosHoje = habitos.filter(h => h.historico && h.historico.includes(hoje)).length;
  const progressoHoje = totalHabitos === 0 ? 0 : (habitosConcluidosHoje / totalHabitos) * 100;

  const obterDiasParaGrafico = () => {
    const dias = periodo === 'semanal' ? 7 : 30;
    return [...Array(dias)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - ((dias - 1) - i));
      return obterDataLocalSegura(d);
    });
  };

  const datasDoPeriodo = obterDiasParaGrafico();

  const dadosGrafico = datasDoPeriodo.map(data => {
    const diaDaSemana = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3);
    const diaDoMes = new Date(data + 'T12:00:00').getDate();
    
    const concluidosNesteDia = habitos.filter(h => h.historico && h.historico.includes(data)).length;
    const porcentagem = totalHabitos === 0 ? 0 : (concluidosNesteDia / totalHabitos) * 100;
    
    return { data, rotulo: periodo === 'semanal' ? diaDaSemana : diaDoMes, porcentagem };
  });

  const totalPossivelPeriodo = totalHabitos * datasDoPeriodo.length;
  const totalConcluidoPeriodo = dadosGrafico.reduce((acc, curr) => acc + (curr.porcentagem / 100) * totalHabitos, 0);
  const taxaConclusaoPeriodo = totalPossivelPeriodo === 0 ? 0 : (totalConcluidoPeriodo / totalPossivelPeriodo) * 100;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Métricas</Text>

      <View style={styles.seletorContainer}>
        <TouchableOpacity 
          style={[styles.botaoSeletor, periodo === 'semanal' && styles.botaoSeletorAtivo]}
          onPress={() => setPeriodo('semanal')}
        >
          <Text style={[styles.textoSeletor, periodo === 'semanal' && styles.textoSeletorAtivo]}>Semanal</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.botaoSeletor, periodo === 'mensal' && styles.botaoSeletorAtivo]}
          onPress={() => setPeriodo('mensal')}
        >
          <Text style={[styles.textoSeletor, periodo === 'mensal' && styles.textoSeletorAtivo]}>Mensal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cartaoDashboard}>
        <View style={styles.cabecalhoDashboard}>
          <View>
            <Text style={styles.textoMetricaTitulo}>Progresso Hoje</Text>
            <Text style={styles.textoMetricaPorcentagem}>{Math.round(progressoHoje)}%</Text>
          </View>
          <Text style={styles.textoMetricaDetalhe}>{habitosConcluidosHoje} / {totalHabitos} concluídos</Text>
        </View>
        <View style={styles.divisor} />
        <View style={styles.cabecalhoDashboard}>
          <View>
            <Text style={styles.textoMetricaTitulo}>Taxa {periodo === 'semanal' ? 'Semanal' : 'Mensal'}</Text>
            <Text style={[styles.textoMetricaPorcentagem, { color: '#34C759' }]}>{Math.round(taxaConclusaoPeriodo)}%</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaGrafico}>
          {dadosGrafico.map((dia, index) => (
            <View key={index} style={[styles.colunaGrafico, { width: periodo === 'semanal' ? 40 : 25 }]}>
              <View style={styles.barraGraficoFundo}>
                <View style={[styles.barraGraficoPreenchida, { height: `${dia.porcentagem}%` }]} />
              </View>
              <Text style={styles.textoEixoX}>{dia.rotulo}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.cartaoInfo}>
        <Text style={styles.textoInfo}>
          {progressoHoje === 100 
            ? "🏆 Dia perfeito! Todos os hábitos foram cumpridos." 
            : "💪 Continue focado! O gráfico mostra sua consistência diária."}
        </Text>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingTop: 50, paddingHorizontal: 20 },
  titulo: { fontSize: 28, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  seletorContainer: { flexDirection: 'row', backgroundColor: '#E0E0E0', borderRadius: 10, marginBottom: 20, padding: 4 },
  botaoSeletor: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  botaoSeletorAtivo: { backgroundColor: '#FFF', elevation: 2 },
  textoSeletor: { fontSize: 16, color: '#666', fontWeight: '600' },
  textoSeletorAtivo: { color: '#007AFF' },
  cartaoDashboard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 3 },
  cabecalhoDashboard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  divisor: { height: 1, backgroundColor: '#EEE', marginBottom: 15 },
  textoMetricaTitulo: { fontSize: 14, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  textoMetricaPorcentagem: { fontSize: 36, fontWeight: '800', color: '#007AFF', marginTop: -5 },
  textoMetricaDetalhe: { fontSize: 14, color: '#666', fontWeight: '500', marginBottom: 8 },
  areaGrafico: { flexDirection: 'row', alignItems: 'flex-end', height: 140, paddingTop: 10, paddingBottom: 5 },
  colunaGrafico: { alignItems: 'center', marginHorizontal: 2 },
  barraGraficoFundo: { height: 100, width: 14, backgroundColor: '#F0F0F0', borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
  barraGraficoPreenchida: { width: '100%', backgroundColor: '#007AFF', borderRadius: 7 },
  textoEixoX: { fontSize: 10, color: '#999', marginTop: 8, textTransform: 'capitalize' },
  cartaoInfo: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, elevation: 1 },
  textoInfo: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20 }
});