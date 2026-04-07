import React from 'react';

export function Window({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="win98-window">
      <div className="win98-titlebar">
        <span>{title}</span>
        <div className="win98-titlebar-actions">{actions}</div>
      </div>
      <div className="win98-window-body">{children}</div>
    </div>
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`win98-button ${props.className || ''}`.trim()} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`win98-input ${props.className || ''}`.trim()} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`win98-input ${props.className || ''}`.trim()} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`win98-input ${props.className || ''}`.trim()} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="win98-label">{children}</div>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="win98-badge">{children}</span>;
}

export function TabButton({ active, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return <button {...props} className={`win98-tab ${active ? 'active' : ''} ${props.className || ''}`.trim()}>{children}</button>;
}
