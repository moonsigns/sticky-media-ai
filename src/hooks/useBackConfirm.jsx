import { useState } from "react";

export default function useBackConfirm(onConfirmBack) {
  const [open, setOpen] = useState(false);

  function askBack() {
    setOpen(true);
  }

  function confirm() {
    setOpen(false);
    onConfirmBack();
  }

  function cancel() {
    setOpen(false);
  }

  return {
    open,
    askBack,
    confirm,
    cancel
  };
}
