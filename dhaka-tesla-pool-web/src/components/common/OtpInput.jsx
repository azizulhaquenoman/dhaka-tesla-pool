import { useRef } from 'react';

/**
 * 6-digit OTP input — each digit in its own box.
 * Props:
 *   value    : string (e.g. "123456")
 *   onChange : (string) => void
 *   length   : number (default 6)
 */
export default function OtpInput({ value = '', onChange, length = 6 }) {
  const refs = useRef([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1); // digits only
    const next = digits.map((d, i) => (i === idx ? char : d)).join('');
    onChange(next);
    // Auto-advance
    if (char && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="otp-input" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`otp-input__box ${d ? 'otp-input__box--filled' : ''}`}
          value={d}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
