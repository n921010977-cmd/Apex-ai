"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";

const TABS = ["Профиль", "Аккаунт", "Уведомления", "Безопасность"];

export default function SettingsPage() {
  const [tab, setTab] = useState("Профиль");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Настройки</h1>
        <p className="text-sm text-white/35">Управляйте своим аккаунтом и предпочтениями</p>
      </div>

      {/* Вкладки */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06] mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs rounded-lg transition-all ${tab === t ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Профиль" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-white mb-5">Личная информация</h2>
              <div className="flex items-center gap-5 mb-6">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-xl font-bold text-white">F</div>
                <div>
                  <p className="text-xs text-white/40 mb-2">Фото профиля</p>
                  <button className="h-8 px-3 text-xs border border-white/[0.10] text-white/60 rounded-lg hover:border-white/20 transition-all">Загрузить фото</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Имя", placeholder: "Founder", value: "Founder" },
                  { label: "Фамилия", placeholder: "Name", value: "" },
                  { label: "Email", placeholder: "founder@example.com", value: "founder@example.com" },
                  { label: "Компания", placeholder: "My Startup", value: "" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs text-white/40 mb-1.5 block">{field.label}</label>
                    <input
                      type="text"
                      defaultValue={field.value}
                      placeholder={field.placeholder}
                      className="w-full h-9 px-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Тарифный план</h2>
              <div className="flex items-center justify-between p-4 rounded-xl bg-violet-600/10 border border-violet-500/20">
                <div>
                  <div className="text-sm font-semibold text-white">Starter</div>
                  <div className="text-xs text-white/40">3 отчёта в месяц · 1 активный проект</div>
                </div>
                <button className="h-8 px-4 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg">Upgrade to Pro</button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <button onClick={handleSave} className="h-9 px-6 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl transition-all hover:from-violet-500 hover:to-blue-500">
              {saved ? "✓ Сохранено" : "Сохранить изменения"}
            </button>
          </div>
        </div>
      )}

      {tab === "Аккаунт" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white mb-2">Управление аккаунтом</h2>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-xs font-medium text-white/70 mb-1">Экспорт данных</div>
              <div className="text-xs text-white/35 mb-3">Скачайте все ваши данные и проекты</div>
              <button className="h-8 px-4 text-xs border border-white/[0.10] text-white/60 rounded-lg hover:border-white/20 transition-all">Запросить экспорт</button>
            </div>
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="text-xs font-medium text-red-400 mb-1">Удалить аккаунт</div>
              <div className="text-xs text-white/35 mb-3">Это действие необратимо. Все данные будут удалены.</div>
              <button className="h-8 px-4 text-xs border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-all">Удалить аккаунт</button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "Уведомления" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-white mb-5">Настройки уведомлений</h2>
            <div className="space-y-4">
              {[
                { label: "Завершение анализа", desc: "Когда AI завершит анализ проекта", on: true },
                { label: "Новые инсайты", desc: "Еженедельные рекомендации от совета директоров", on: true },
                { label: "Обновления продукта", desc: "Новые функции и улучшения", on: false },
                { label: "Маркетинговые письма", desc: "Советы, гайды и кейсы", on: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
                  <div>
                    <div className="text-sm text-white/70">{item.label}</div>
                    <div className="text-xs text-white/30">{item.desc}</div>
                  </div>
                  <div className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${item.on ? "bg-violet-600" : "bg-white/10"}`}>
                    <div className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${item.on ? "left-5" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "Безопасность" && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white">Безопасность</h2>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Текущий пароль</label>
              <input type="password" placeholder="••••••••" className="w-full h-9 px-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Новый пароль</label>
              <input type="password" placeholder="••••••••" className="w-full h-9 px-3 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors" />
            </div>
            <button className="h-9 px-6 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl">Сменить пароль</button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
