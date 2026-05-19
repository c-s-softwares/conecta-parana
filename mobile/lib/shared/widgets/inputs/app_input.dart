import 'package:flutter/material.dart';

enum AppInputType {
  text,
  password,
  search,
  dropdown,
  date,
}

class AppInput extends StatefulWidget {
  final String label;
  final String? hint;
  final AppInputType type;
  final String? errorText;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final List<String>? dropdownItems;
  final ValueChanged<String?>? onDropdownChanged;

  const AppInput({
    super.key,
    required this.label,
    this.hint,
    this.type = AppInputType.text,
    this.errorText,
    this.controller,
    this.onChanged,
    this.dropdownItems,
    this.onDropdownChanged,
  });

  @override
  State<AppInput> createState() => _AppInputState();
}

class _AppInputState extends State<AppInput> {
  bool _obscureText = true;
  String? _selectedDropdownItem;
  DateTime? _selectedDate;

  Future<void> _pickDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
      if (widget.onChanged != null) {
        widget.onChanged!(
          '${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: widget.label,
      textField: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          if (widget.type == AppInputType.dropdown)
            _buildDropdown(context)
          else if (widget.type == AppInputType.date)
            _buildDatePicker(context)
          else
            _buildTextField(context),
        ],
      ),
    );
  }

  Widget _buildTextField(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      onChanged: widget.onChanged,
      obscureText: widget.type == AppInputType.password && _obscureText,
      decoration: InputDecoration(
        hintText: widget.hint,
        filled: true,
        fillColor: const Color(0xFFFFF0EE),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: Theme.of(context).colorScheme.primary,
            width: 1.5,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: Theme.of(context).colorScheme.error,
            width: 1.5,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: Theme.of(context).colorScheme.error,
            width: 1.5,
          ),
        ),
        errorText: widget.errorText,
        prefixIcon: widget.type == AppInputType.search
            ? const Icon(Icons.search)
            : null,
        suffixIcon: widget.type == AppInputType.password
            ? TextButton(
                onPressed: () {
                  setState(() {
                    _obscureText = !_obscureText;
                  });
                },
                child: Text(
                  _obscureText ? 'Mostrar' : 'Ocultar',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
            : null,
      ),
    );
  }

  Widget _buildDropdown(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF0EE),
        borderRadius: BorderRadius.circular(8),
        border: widget.errorText != null
            ? Border.all(color: Theme.of(context).colorScheme.error, width: 1.5)
            : Border.all(color: Colors.transparent),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedDropdownItem,
          hint: Text(widget.hint ?? 'Selecione'),
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down),
          items: widget.dropdownItems?.map((item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(item),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedDropdownItem = value;
            });
            if (widget.onDropdownChanged != null) {
              widget.onDropdownChanged!(value);
            }
          },
        ),
      ),
    );
  }

  Widget _buildDatePicker(BuildContext context) {
    final dateText = _selectedDate != null
        ? '${_selectedDate!.day.toString().padLeft(2, '0')}/${_selectedDate!.month.toString().padLeft(2, '0')}/${_selectedDate!.year}'
        : widget.hint ?? 'DD/MM/AAAA';

    return GestureDetector(
      onTap: () => _pickDate(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF0EE),
          borderRadius: BorderRadius.circular(8),
          border: widget.errorText != null
              ? Border.all(color: Theme.of(context).colorScheme.error, width: 1.5)
              : Border.all(color: Colors.transparent),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                dateText,
                style: TextStyle(
                  color: _selectedDate != null ? Colors.black87 : Colors.grey,
                  fontSize: 16,
                ),
              ),
            ),
            const Icon(Icons.calendar_today_outlined, size: 20, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}