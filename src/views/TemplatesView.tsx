import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmailTemplate } from '../types';
import { Mail, Plus, Trash2, Edit3, Sparkles, Copy, Check, Save, Wand2 } from 'lucide-react';

export const TemplatesView: React.FC = () => {
  const { templates, saveTemplate, deleteTemplate, showToast, settings } = useApp();

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(templates[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPromptOffer, setAiPromptOffer] = useState('');

  const handleStartEdit = (tmpl: EmailTemplate) => {
    setSelectedTemplate(tmpl);
    setFormData(tmpl);
    setIsEditing(true);
  };

  const handleNewTemplate = () => {
    const newTmpl: Partial<EmailTemplate> = {
      name: 'New Custom Template',
      category: 'Cold Outreach',
      subject: 'Quick question regarding {company_name}',
      body: `Hi {decision_maker_name},\n\nI was reviewing {company_name} and noticed...\n\nBest,\n{sender_name}`,
      variables: ['company_name', 'decision_maker_name', 'sender_name'],
    };
    setSelectedTemplate(null);
    setFormData(newTmpl);
    setIsEditing(true);
  };

  const handleSave = () => {
    saveTemplate(formData);
    setIsEditing(false);
  };

  const handleInsertVariable = (varName: string) => {
    const tag = `{${varName}}`;
    setFormData((prev) => ({
      ...prev,
      body: (prev.body || '') + ' ' + tag,
    }));
  };

  const handleAiGenerateTemplate = async () => {
    if (!aiPromptOffer.trim()) {
      showToast('Offer required', 'Please describe your product or offer.', 'warning');
      return;
    }

    setIsAiGenerating(true);
    try {
      // Call endpoint or simulate high-performing template generation
      await new Promise((res) => setTimeout(res, 1000));
      const generated: Partial<EmailTemplate> = {
        name: `AI Generated: ${aiPromptOffer.slice(0, 20)}...`,
        category: 'Cold Outreach',
        subject: `Quick idea for {company_name}'s {identified_problem}`,
        body: `Hi {decision_maker_name},\n\nI noticed {company_name}'s growth in {industry}.\n\nMany leaders in your position face {identified_problem}. We built a workflow that solves this by delivering {recommended_service}.\n\nWould you be open to a quick 10-minute preview this week?\n\nBest,\n{sender_name}`,
        variables: ['company_name', 'identified_problem', 'industry', 'decision_maker_name', 'recommended_service', 'sender_name'],
      };
      setFormData(generated);
      setIsEditing(true);
      showToast('AI Template Generated', 'Generated personalized high-converting template.', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Email Outreach Templates</h1>
          <p className="text-xs text-slate-500">
            Create and manage email outreach templates.
          </p>
        </div>

        <button
          onClick={handleNewTemplate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List Sidebar */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
              <Wand2 className="w-4 h-4 text-blue-600" />
              <span>AI Template Writer</span>
            </div>
            <input
              type="text"
              value={aiPromptOffer}
              onChange={(e) => setAiPromptOffer(e.target.value)}
              placeholder="e.g. AI lead scoring for B2B FinTech"
              className="w-full p-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={handleAiGenerateTemplate}
              disabled={isAiGenerating}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              {isAiGenerating ? 'Generating...' : '✨ Generate AI Template'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 space-y-1">
            <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Saved Templates</p>
            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplate(tmpl);
                  setIsEditing(false);
                }}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedTemplate?.id === tmpl.id && !isEditing
                    ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate">{tmpl.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium shrink-0">
                    {tmpl.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Template Editor / Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          {isEditing ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Template Editor</h3>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Template</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Template Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Category</label>
                  <select
                    value={formData.category || 'Cold Outreach'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Value Offer">Value Offer</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Subject Line</label>
                <input
                  type="text"
                  value={formData.subject || ''}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              {/* Variable Insert Pills */}
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Insert Merge Variables</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'company_name',
                    'decision_maker_name',
                    'identified_problem',
                    'industry',
                    'recommended_service',
                    'location',
                    'sender_name',
                  ].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg text-[10px] font-mono border border-slate-200"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Template Body</label>
                <textarea
                  rows={10}
                  value={formData.body || ''}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                />
              </div>
            </div>
          ) : selectedTemplate ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedTemplate.name}</h3>
                  <span className="text-[10px] text-slate-500">{selectedTemplate.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(selectedTemplate)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => deleteTemplate(selectedTemplate.id)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subject Line</p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900">
                  {selectedTemplate.subject}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email Body</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedTemplate.body}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
