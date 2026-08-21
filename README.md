# Simulador Balístico Fictício

> **Aviso Permanente:** Simulação de física balística e aeroespacial baseada em cenários fictícios. Destinada exclusivamente a fins educacionais e de pesquisa acadêmica.

---

## 1. Visão Geral do Projeto

O **Simulador Balístico Fictício** é uma aplicação web interativa desenvolvida com rigor físico-matemático para demonstrar os princípios fundamentais da mecânica clássica, dinâmica orbital, termodinâmica atmosférica e balística exterior.

Todas as entidades geográficas e territoriais utilizadas são fictícias (*Continente Alpha*, *Continente Ômega*, *Arquipélago Neutro*, *Zona de Testes 01*). O aplicativo não fornece instruções para construção, manuseio ou operação de armas reais.

---

## 2. Modelagem Física e Equações Diferenciais

A simulação integra numericamente as equações de movimento utilizando o **Método de Runge-Kutta de 4ª Ordem (RK4)** com passos adaptativos e sub-stepping determinístico.

### 2.1 Segunda Lei de Newton e Forças Acopladas
A aceleração total do veículo é dada pela soma vetorial:

$$\vec{a} = \frac{\vec{T} + \vec{F}_d}{m(t)} + \vec{g}(r) + \vec{a}_{centrífuga} + \vec{a}_{coriolis}$$

### 2.2 Força de Arrasto Aerodinâmico Compressível (Rayleigh)
$$F_d = \frac{1}{2} \rho(h) \cdot v_{rel}^2 \cdot C_d(\text{Mach}, \text{ogiva}) \cdot A$$

Onde:
- $\rho(h)$ é a densidade do ar calculada pelo modelo padrão internacional (ISA) em camadas (Troposfera, Estratosfera, Mesosfera e Termosfera).
- $C_d(\text{Mach})$ varia dinamicamente exibindo o pico transônico de onda de choque (Wave Drag) entre Mach 0.8 e 1.4.
- $q = \frac{1}{2} \rho v^2$ é a pressão dinâmica máxima (Max Q).

### 2.3 Equação do Foguete de Tsiolkovsky e Multi-Estágios
$$\Delta v = I_{sp} \cdot g_0 \cdot \ln\left(\frac{m_0}{m_f}\right)$$
$$\dot{m} = \frac{T}{I_{sp} \cdot g_0}$$

Quando o propelente de um estágio se esgota, o simulador desacopla a massa seca estrutural vazia (*jettison*), permitindo ganho expressivo de eficiência e aceleração crescente.

### 2.4 Gravitação Universal Esférica
$$g(r) = g_0 \left(\frac{R_{planeta}}{R_{planeta} + h}\right)^2$$

### 2.5 Efeito Coriolis
$$\vec{a}_{coriolis} = -2 (\vec{\omega} \times \vec{v})$$

---

## 3. Estrutura Modular da Aplicação

- `/src/types/physics.ts`: Tipos e interfaces de vetores, estágios, telemetria e cenários.
- `/src/physics/constants.ts`: Constantes universais (G, R, g0, ISA).
- `/src/physics/atmosphere.ts`: Modelo barométrico ISA, velocidade do som e curvas Cd(Mach).
- `/src/physics/engine.ts`: Motor de cálculo diferencial e integração RK4.
- `/src/physics/monteCarlo.ts`: Algoritmo estocástico de dispersão e cálculo de CEP 50%/95%.
- `/src/physics/unitTests.ts`: Bateria de testes unitários que valida as equações em tempo de execução.
- `/src/data/presets.ts`: Cenários didáticos pré-configurados.
- `/src/data/fictionalGeography.ts`: Territórios e polígonos de teste acadêmicos fictícios.
- `/src/components/`:
  - `CanvasRenderer.tsx`: Renderizador 2D/3D (Orbital, Perfil Altitude vs Alcance e Radar).
  - `TelemetryHUD.tsx`: Mostradores digitais e instrumentos em tempo real.
  - `SimulationControls.tsx`: Play/Pause, Step, Time-warp 1x–100x e Exportação CSV/JSON.
  - `ChartsPanel.tsx`: Gráficos sincronizados via Recharts.
  - `ProjectileBuilder.tsx`: Construtor de veículos e múltiplos estágios.
  - `EnvironmentConfig.tsx`: Painel de gravidade, raio e camadas de vento.
  - `PresetScenarios.tsx`: Seletor de casos de estudo.
  - `PostFlightReport.tsx`: Relatório pós-impacto com análise de energia cinética e CEP.
  - `PhysicsLab.tsx`: Laboratório teórico e validador de testes unitários.
  - `OverviewSection.tsx`: Diagrama esquemático das 4 fases de voo.
  - `DocumentationModal.tsx`: Manual completo in-app.

---

## 4. Testes e Validação Científica

O aplicativo inclui uma suíte de testes unitários que pode ser executada interativamente na aba **Laboratório**:
1. *Alcance Balístico Parabólico no Vácuo (Equação de Galileu/Newton)*
2. *Equação Fundamental de Foguete de Tsiolkovsky*
3. *Velocidade Terminal com Arrasto Aerodinâmico*
4. *Gravitação Esférica (Inverso do Quadrado)*
5. *Pressão Dinâmica Max Q (Equação de Rayleigh)*

---

## 5. Licença e Ética

Uso estritamente acadêmico, científico e educacional.
