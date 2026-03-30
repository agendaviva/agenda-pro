<!-- DATA + HORÁRIO (lado a lado) -->
<div class="grid grid-cols-2 gap-2">
  
  <div>
    <label class="block text-xs text-gray-600 mb-1">
      Data
    </label>
    <input
      type="date"
      id="data"
      value="${dataAtual}"
      class="w-full border rounded-lg px-3 py-2 text-sm"
      required
    />
  </div>

  <div>
    <label class="block text-xs text-gray-600 mb-1">
      Horário
    </label>
    <input
      type="time"
      id="horario"
      value="${horarioAtual}"
      class="w-full border rounded-lg px-3 py-2 text-sm"
    />
  </div>

</div>
