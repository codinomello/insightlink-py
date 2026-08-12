"""
analytics.py
-------------
Cálculos de cruzamento de dados (cross-tabulations) e correlações
usados pelos gráficos avançados do dashboard: heatmap empresa x cargo,
matriz empresa x tipo, correlação completude x volume de texto, etc.
"""
from collections import Counter, defaultdict

import numpy as np
import pandas as pd


def _to_dataframe(records: list[dict]) -> pd.DataFrame:
    if not records:
        return pd.DataFrame(columns=[
            "tipo", "empresa", "cargo", "proponente", "titulo",
            "palavras", "completude",
        ])
    df = pd.DataFrame(records)
    for col in ["tipo", "empresa", "cargo", "proponente", "titulo"]:
        if col not in df.columns:
            df[col] = None
    for col in ["palavras", "completude"]:
        if col not in df.columns:
            df[col] = 0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


def crosstab_empresa_cargo(records: list[dict], top_n: int = 12) -> dict:
    """Matriz (heatmap) de quantidade de registros por Empresa x Cargo."""
    df = _to_dataframe(records)
    df = df[df["empresa"].notna() & df["cargo"].notna()]
    if df.empty:
        return {"empresas": [], "cargos": [], "matriz": []}

    top_empresas = df["empresa"].value_counts().head(top_n).index.tolist()
    top_cargos = df["cargo"].value_counts().head(top_n).index.tolist()
    sub = df[df["empresa"].isin(top_empresas) & df["cargo"].isin(top_cargos)]

    pivot = pd.crosstab(sub["empresa"], sub["cargo"])
    pivot = pivot.reindex(index=top_empresas, columns=top_cargos, fill_value=0)

    matriz = []
    for empresa in pivot.index:
        for cargo in pivot.columns:
            valor = int(pivot.loc[empresa, cargo])
            if valor > 0:
                matriz.append({"empresa": empresa, "cargo": cargo, "quantidade": valor})

    return {"empresas": top_empresas, "cargos": top_cargos, "matriz": matriz}


def crosstab_empresa_tipo(records: list[dict], top_n: int = 10) -> list[dict]:
    """Quantidade de Desafios x Projetos por Empresa (barras empilhadas)."""
    df = _to_dataframe(records)
    df = df[df["empresa"].notna()]
    if df.empty:
        return []

    top_empresas = df["empresa"].value_counts().head(top_n).index.tolist()
    sub = df[df["empresa"].isin(top_empresas)]
    pivot = pd.crosstab(sub["empresa"], sub["tipo"]).reindex(index=top_empresas, fill_value=0)

    resultado = []
    for empresa in pivot.index:
        row = {"empresa": empresa}
        for tipo in pivot.columns:
            row[tipo] = int(pivot.loc[empresa, tipo])
        resultado.append(row)
    return resultado


def correlacao_palavras_completude(records: list[dict]) -> dict:
    """Correlação entre volume de texto (palavras) e completude do formulário."""
    df = _to_dataframe(records)
    df = df[(df["palavras"] > 0)]
    if len(df) < 2:
        coeficiente = 0.0
    else:
        coeficiente = float(np.corrcoef(df["palavras"], df["completude"])[0, 1])
        if np.isnan(coeficiente):
            coeficiente = 0.0

    pontos = [
        {
            "titulo": row["titulo"],
            "empresa": row["empresa"],
            "tipo": row["tipo"],
            "palavras": int(row["palavras"]),
            "completude": int(row["completude"]),
        }
        for _, row in df.iterrows()
    ]
    return {"coeficiente": round(coeficiente, 3), "pontos": pontos}


def completude_por_tipo(records: list[dict]) -> list[dict]:
    """Estatísticas (média/min/máx) de completude, agrupadas por tipo."""
    df = _to_dataframe(records)
    df = df[df["tipo"].notna()]
    if df.empty:
        return []

    grupos = df.groupby("tipo")["completude"].agg(["mean", "min", "max", "count"])
    return [
        {
            "tipo": tipo,
            "media": round(float(row["mean"]), 1),
            "minimo": int(row["min"]),
            "maximo": int(row["max"]),
            "quantidade": int(row["count"]),
        }
        for tipo, row in grupos.iterrows()
    ]


def radar_por_empresa(records: list[dict], top_n: int = 6) -> dict:
    """
    Perfil comparativo (radar) das top empresas em 4 eixos normalizados
    (0-100): volume de registros, completude média, diversidade de cargos
    e volume médio de texto.
    """
    df = _to_dataframe(records)
    df = df[df["empresa"].notna()]
    if df.empty:
        return {"empresas": [], "eixos": [], "dados": []}

    top_empresas = df["empresa"].value_counts().head(top_n).index.tolist()
    sub = df[df["empresa"].isin(top_empresas)]

    volume = sub.groupby("empresa").size()
    completude_media = sub.groupby("empresa")["completude"].mean()
    diversidade_cargos = sub.groupby("empresa")["cargo"].nunique()
    palavras_media = sub.groupby("empresa")["palavras"].mean()

    def normalizar(serie: pd.Series) -> pd.Series:
        maximo = serie.max()
        return (serie / maximo * 100).round(1) if maximo > 0 else serie * 0

    eixos = ["Volume de Registros", "Completude Média", "Diversidade de Cargos", "Volume de Texto"]
    dados = []
    for eixo, serie in zip(
        eixos,
        [normalizar(volume), normalizar(completude_media), normalizar(diversidade_cargos), normalizar(palavras_media)],
    ):
        linha = {"eixo": eixo}
        for empresa in top_empresas:
            linha[empresa] = float(serie.get(empresa, 0))
        dados.append(linha)

    return {"empresas": top_empresas, "eixos": eixos, "dados": dados}


def treemap_empresas(records: list[dict], top_n: int = 15) -> list[dict]:
    """Estrutura para treemap: tamanho = quantidade de registros por empresa."""
    df = _to_dataframe(records)
    df = df[df["empresa"].notna()]
    if df.empty:
        return []
    contagem = df["empresa"].value_counts().head(top_n)
    return [{"name": empresa, "size": int(qtd)} for empresa, qtd in contagem.items()]


def build_full_analytics(records: list[dict]) -> dict:
    return {
        "crosstab_empresa_cargo": crosstab_empresa_cargo(records),
        "crosstab_empresa_tipo": crosstab_empresa_tipo(records),
        "correlacao_palavras_completude": correlacao_palavras_completude(records),
        "completude_por_tipo": completude_por_tipo(records),
        "radar_por_empresa": radar_por_empresa(records),
        "treemap_empresas": treemap_empresas(records),
    }