"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  AlertTriangle,
  Layers,
} from "lucide-react"
import { supabase } from "../lib/supabase"

export default function Dashboard() {
  const [stats, setStats] =
    useState({
      ativos: 0,
      inativos: 0,
      alertas: 0,
      turmas: 0,
    })

  const [turmas, setTurmas] =
    useState<any[]>([])

  const [
    modalidades,
    setModalidades,
  ] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  const carregar =
    async () => {
      const {
        data: alunos,
      } = await supabase
        .from("alunos")
        .select("*")

      const ativos =
        (
          alunos || []
        ).filter(
          (a: any) =>
            a.status ===
            "ativo"
        ).length

      const inativos =
        (
          alunos || []
        ).filter(
          (a: any) =>
            a.status ===
            "inativo"
        ).length

      const {
        data:
          listaTurmas,
      } = await supabase
        .from("turmas")
        .select("*")

      const {
        data:
          mensalidades,
      } = await supabase
        .from(
          "mensalidades"
        )
        .select("*")

      const alertas =
        (
          mensalidades ||
          []
        ).filter(
          (m: any) =>
            m.status !==
            "pago"
        ).length

      /* alunos por turma */
      const mapaTurmas:
        any = {}

      ;(
        alunos || []
      ).forEach(
        (a: any) => {
          const nome =
            a.turma ||
            "Sem turma"

          mapaTurmas[
            nome
          ] =
            (mapaTurmas[
              nome
            ] || 0) + 1
        }
      )

      const arrTurmas =
        Object.keys(
          mapaTurmas
        ).map(
          (nome) => ({
            nome,
            alunos:
              mapaTurmas[
                nome
              ],
          })
        )

      /* alunos por modalidade */
      const mapaMod:
        any = {}

      ;(
        alunos || []
      ).forEach(
        (a: any) => {
          const nome =
            a.modalidade ||
            "Sem modalidade"

          mapaMod[nome] =
            (mapaMod[
              nome
            ] || 0) + 1
        }
      )

      const arrMod =
        Object.keys(
          mapaMod
        ).map(
          (nome) => ({
            nome,
            qtd: mapaMod[nome],
          })
        )

      setStats({
        ativos,
        inativos,
        alertas,
        turmas:
          (
            listaTurmas ||
            []
          ).length,
      })

      setTurmas(
        arrTurmas
      )

      setModalidades(
        arrMod
      )
    }

  const cards = [
    {
      title:
        "Alunos Ativos",
      value:
        stats.ativos,
      icon: Users,
    },
    {
      title:
        "Alunos Inativos",
      value:
        stats.inativos,
      icon: Users,
    },
    {
      title:
        "Alertas",
      value:
        stats.alertas,
      icon:
        AlertTriangle,
    },
    {
      title:
        "Turmas",
      value:
        stats.turmas,
      icon: Layers,
    },
  ]

  const maiorTurma =
    turmas.length
      ? Math.max(
          ...turmas.map(
            (t) =>
              t.alunos
          )
        )
      : 1

  const maiorMod =
    modalidades.length
      ? Math.max(
          ...modalidades.map(
            (m) =>
              m.qtd
          )
        )
      : 1

  return (
    <div>

      <h2 className="text-2xl font-semibold mb-6">
        Visão Geral
      </h2>

      {/* cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">

        {cards.map(
          (s, i) => (
            <Card
              key={i}
              className="bg-zinc-900 border border-red-900"
            >
              <CardContent className="p-4 flex items-center justify-between">

                <div>
                  <p className="text-sm text-zinc-400">
                    {s.title}
                  </p>

                  <p className="text-2xl font-bold">
                    {s.value}
                  </p>
                </div>

                <s.icon className="text-red-500" />

              </CardContent>
            </Card>
          )
        )}

      </div>

      {/* gráficos */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* turma */}
        <Card className="bg-zinc-900 border border-red-900">
          <CardContent className="p-6">

            <h3 className="mb-4 text-zinc-300">
              Alunos por Turma
            </h3>

            <div className="space-y-4">

              {turmas.length ===
              0 ? (
                <p className="text-zinc-500">
                  Nenhum dado
                </p>
              ) : (
                turmas.map(
                  (
                    t,
                    i
                  ) => (
                    <div
                      key={i}
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          {
                            t.nome
                          }
                        </span>

                        <span>
                          {
                            t.alunos
                          }
                        </span>
                      </div>

                      <div className="w-full bg-zinc-800 rounded-full h-2">

                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (t.alunos /
                                maiorTurma) *
                              100
                            }%`,
                          }}
                        />

                      </div>
                    </div>
                  )
                )
              )}

            </div>

          </CardContent>
        </Card>

        {/* modalidade */}
        <Card className="bg-zinc-900 border border-red-900">
          <CardContent className="p-6">

            <h3 className="mb-4 text-zinc-300">
              Distribuição por Modalidade
            </h3>

            <div className="space-y-4">

              {modalidades.length ===
              0 ? (
                <p className="text-zinc-500">
                  Nenhum dado
                </p>
              ) : (
                modalidades.map(
                  (
                    m,
                    i
                  ) => (
                    <div
                      key={i}
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          {
                            m.nome
                          }
                        </span>

                        <span>
                          {
                            m.qtd
                          }
                        </span>
                      </div>

                      <div className="w-full bg-zinc-800 rounded-full h-2">

                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (m.qtd /
                                maiorMod) *
                              100
                            }%`,
                          }}
                        />

                      </div>
                    </div>
                  )
                )
              )}

            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  )
}