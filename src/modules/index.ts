/**
 * Ponto de Integração e Separação de Responsabilidades da Arquitetura Modular
 * Agrupa os domínios autônomos:
 * 1. physics: Equações diferenciais, RK4, ISA, forças e Monte Carlo
 * 2. simulation: Controle de loop, tempo real, estados e configurações
 * 3. telemetry: Métricas derivadas, conversões e análises
 */

export * from '../physics';
export * from './simulation';
export * from './telemetry';
