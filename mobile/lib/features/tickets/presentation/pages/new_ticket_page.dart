import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image/image.dart' as image_lib;
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

import 'package:conectaparana/features/tickets/data/repository/ticket_repository.dart';

enum NewTicketPhotoSource { camera, gallery }

class NewTicketPhoto {
  final Uint8List bytes;
  final String fileName;
  final String mimeType;

  const NewTicketPhoto({
    required this.bytes,
    required this.fileName,
    required this.mimeType,
  });

  TicketPhotoUpload toUpload() {
    return TicketPhotoUpload(
      bytes: bytes,
      fileName: fileName,
      mimeType: mimeType,
    );
  }
}

abstract class NewTicketMediaPicker {
  Future<NewTicketPhoto?> pickPhoto(NewTicketPhotoSource source);
}

class NewTicketPermissionDeniedException implements Exception {
  final NewTicketPhotoSource source;

  const NewTicketPermissionDeniedException(this.source);
}

class NewTicketInvalidPhotoException implements Exception {}

class NewTicketPhotoTooLargeException implements Exception {}

class ImagePickerNewTicketMediaPicker implements NewTicketMediaPicker {
  static const int _maxPixels = 1080;
  static const int _maxBytes = 2 * 1024 * 1024;
  static const int _backendMaxBytes = 5 * 1024 * 1024;

  final ImagePicker _picker;

  ImagePickerNewTicketMediaPicker({ImagePicker? picker})
    : _picker = picker ?? ImagePicker();

  @override
  Future<NewTicketPhoto?> pickPhoto(NewTicketPhotoSource source) async {
    try {
      final file = await _picker.pickImage(
        source: source == NewTicketPhotoSource.camera
            ? ImageSource.camera
            : ImageSource.gallery,
        imageQuality: 100,
      );
      if (file == null) return null;

      final mimeType = _mimeTypeFor(file);
      if (!_isSupportedMimeType(mimeType)) {
        throw NewTicketInvalidPhotoException();
      }

      final raw = await file.readAsBytes();
      final decoded = image_lib.decodeImage(raw);
      if (decoded == null) throw NewTicketInvalidPhotoException();

      final resized = _resizeIfNeeded(decoded);
      var quality = 86;
      var encoded = Uint8List.fromList(
        image_lib.encodeJpg(resized, quality: quality),
      );

      while (encoded.length > _maxBytes && quality > 46) {
        quality -= 8;
        encoded = Uint8List.fromList(
          image_lib.encodeJpg(resized, quality: quality),
        );
      }

      if (encoded.length > _backendMaxBytes) {
        throw NewTicketPhotoTooLargeException();
      }

      return NewTicketPhoto(
        bytes: encoded,
        fileName: '${DateTime.now().millisecondsSinceEpoch}.jpg',
        mimeType: 'image/jpeg',
      );
    } on PlatformException catch (e) {
      final code = e.code.toLowerCase();
      if (code.contains('denied') || code.contains('restricted')) {
        throw NewTicketPermissionDeniedException(source);
      }
      rethrow;
    }
  }

  image_lib.Image _resizeIfNeeded(image_lib.Image original) {
    final longestSide = original.width > original.height
        ? original.width
        : original.height;
    if (longestSide <= _maxPixels) return original;

    if (original.width >= original.height) {
      return image_lib.copyResize(original, width: _maxPixels);
    }

    return image_lib.copyResize(original, height: _maxPixels);
  }

  String _mimeTypeFor(XFile file) {
    final explicit = file.mimeType;
    if (explicit != null && explicit.isNotEmpty) return explicit;

    final lower = file.name.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    return 'application/octet-stream';
  }

  bool _isSupportedMimeType(String mimeType) {
    return mimeType == 'image/jpeg' ||
        mimeType == 'image/png' ||
        mimeType == 'image/webp';
  }
}

class NewTicketPage extends StatefulWidget {
  final TicketRepository? repository;
  final NewTicketMediaPicker? mediaPicker;

  const NewTicketPage({super.key, this.repository, this.mediaPicker});

  @override
  State<NewTicketPage> createState() => _NewTicketPageState();
}

class _NewTicketPageState extends State<NewTicketPage> {
  static const int _titleMinLength = 5;
  static const int _descriptionMinLength = 10;
  static const int _maxPhotos = 3;

  static const _types = [
    _TicketTypeOption(
      value: 'acidente',
      label: 'Acidente',
      icon: Icons.warning_amber_rounded,
      color: Color(0xFFE53935),
    ),
    _TicketTypeOption(
      value: 'sinalização',
      label: 'Sinalização',
      icon: Icons.info_outline,
      color: Color(0xFF4D5A55),
    ),
    _TicketTypeOption(
      value: 'iluminação',
      label: 'Iluminação',
      icon: Icons.lightbulb_outline,
      color: Color(0xFFC79B00),
    ),
    _TicketTypeOption(
      value: 'lixo',
      label: 'Lixo',
      icon: Icons.delete_outline,
      color: Color(0xFF006733),
    ),
    _TicketTypeOption(
      value: 'outros',
      label: 'Outros',
      icon: Icons.description_outlined,
      color: Color(0xFF4D5A55),
    ),
  ];

  late final TicketRepository _repository;
  late final NewTicketMediaPicker _mediaPicker;

  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _addressController = TextEditingController();

  String? _selectedType;
  final List<NewTicketPhoto> _photos = [];
  bool _hasTriedSubmit = false;
  bool _titleTouched = false;
  bool _descriptionTouched = false;
  bool _isSubmitting = false;

  bool get _isTitleValid =>
      _titleController.text.trim().length >= _titleMinLength;

  bool get _isDescriptionValid =>
      _descriptionController.text.trim().length >= _descriptionMinLength;

  bool get _canSubmit {
    return _selectedType != null &&
        _isTitleValid &&
        _isDescriptionValid &&
        !_isSubmitting;
  }

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? RemoteTicketRepository();
    _mediaPicker = widget.mediaPicker ?? ImagePickerNewTicketMediaPicker();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() => _hasTriedSubmit = true);

    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid || !_canSubmit) return;

    setState(() => _isSubmitting = true);

    try {
      final ticket = await _repository.createTicket(
        CreateTicketRequest(
          type: _selectedType!,
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
          address: _addressController.text.trim(),
        ),
      );

      var failedPhotos = false;
      if (_photos.isNotEmpty) {
        final uploads = _photos.map((photo) async {
          try {
            await _repository.uploadTicketPhoto(
              ticketId: ticket.id,
              photo: photo.toUpload(),
            );
          } on TicketStorageUnavailableException {
            failedPhotos = true;
          } on TicketNetworkException {
            failedPhotos = true;
          }
        });
        await Future.wait(uploads);
      }

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            failedPhotos
                ? 'Ticket aberto. Algumas fotos não foram enviadas.'
                : 'Ticket aberto!',
          ),
        ),
      );
      context.go('/tickets/${ticket.id}');
    } on TicketUserWithoutCityException {
      if (!mounted) return;
      _showSnackBar('Selecione sua cidade na Home antes de abrir tickets.');
    } on TicketNetworkException {
      if (!mounted) return;
      _showSnackBar(
        'Erro de conexão. Verifique sua internet e tente novamente.',
      );
    } catch (_) {
      if (!mounted) return;
      _showSnackBar('Não foi possível abrir o ticket. Tente novamente.');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _showPhotoOptions() async {
    if (_photos.length >= _maxPhotos || _isSubmitting) return;

    final source = await showModalBottomSheet<NewTicketPhotoSource>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Câmera'),
              onTap: () =>
                  Navigator.of(context).pop(NewTicketPhotoSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Galeria'),
              onTap: () =>
                  Navigator.of(context).pop(NewTicketPhotoSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    try {
      final photo = await _mediaPicker.pickPhoto(source);
      if (photo == null) return;

      setState(() {
        _photos.add(photo);
      });
    } on NewTicketPermissionDeniedException catch (e) {
      if (!mounted) return;
      await _showPermissionDialog(e.source);
    } on NewTicketInvalidPhotoException {
      if (!mounted) return;
      _showSnackBar('Formato não suportado. Use jpeg/png/webp.');
    } on NewTicketPhotoTooLargeException {
      if (!mounted) return;
      _showSnackBar('Imagem muito grande. Tente outra foto.');
    }
  }

  Future<void> _showPermissionDialog(NewTicketPhotoSource source) async {
    final message = source == NewTicketPhotoSource.camera
        ? 'Câmera necessária para tirar fotos.'
        : 'Acesso à galeria necessário.';

    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Permissão necessária'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await openAppSettings();
            },
            child: const Text('Abrir configurações'),
          ),
        ],
      ),
    );
  }

  void _removePhoto(int index) {
    if (_isSubmitting) return;
    setState(() => _photos.removeAt(index));
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFFF7F9FA);
    const titleColor = Color(0xFF071A12);
    const primaryColor = Color(0xFF007A3D);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _BackButtonCircle(enabled: !_isSubmitting),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'PROBLEMA URBANO',
                            style: TextStyle(
                              color: primaryColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 2,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Novo Ticket',
                            style: TextStyle(
                              color: titleColor,
                              fontSize: 30,
                              height: 1,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const _InfoBox(),
                const SizedBox(height: 20),
                const _FieldLabel(text: 'TIPO DO PROBLEMA'),
                const SizedBox(height: 12),
                _TypeGrid(
                  types: _types,
                  selectedType: _selectedType,
                  enabled: !_isSubmitting,
                  onSelect: (type) => setState(() => _selectedType = type),
                ),
                const SizedBox(height: 28),
                const _FieldLabel(text: 'TÍTULO'),
                const SizedBox(height: 10),
                TextFormField(
                  key: const Key('new_ticket_title_field'),
                  controller: _titleController,
                  enabled: !_isSubmitting,
                  decoration: _inputDecoration(
                    hintText: 'Poste apagado na Rua das Flores',
                    focusedBorderColor: primaryColor,
                  ),
                  validator: (value) {
                    if (!_hasTriedSubmit && !_titleTouched) return null;
                    if ((value ?? '').trim().length < _titleMinLength) {
                      return 'Título deve ter pelo menos 5 caracteres.';
                    }
                    return null;
                  },
                  onChanged: (_) {
                    setState(() => _titleTouched = true);
                    _formKey.currentState?.validate();
                  },
                ),
                const SizedBox(height: 24),
                const _FieldLabel(text: 'DESCRIÇÃO'),
                const SizedBox(height: 10),
                TextFormField(
                  key: const Key('new_ticket_description_field'),
                  controller: _descriptionController,
                  enabled: !_isSubmitting,
                  minLines: 5,
                  maxLines: 7,
                  keyboardType: TextInputType.multiline,
                  decoration: _inputDecoration(
                    hintText:
                        'O poste no cruzamento está apagado há 3 dias, causando insegurança à noite...',
                  ),
                  validator: (value) {
                    if (!_hasTriedSubmit && !_descriptionTouched) return null;
                    if ((value ?? '').trim().length < _descriptionMinLength) {
                      return 'Descrição deve ter pelo menos 10 caracteres.';
                    }
                    return null;
                  },
                  onChanged: (_) {
                    setState(() => _descriptionTouched = true);
                    _formKey.currentState?.validate();
                  },
                ),
                const SizedBox(height: 24),
                const _FieldLabel(text: 'LOCALIZAÇÃO (opcional)'),
                const SizedBox(height: 10),
                TextFormField(
                  key: const Key('new_ticket_address_field'),
                  controller: _addressController,
                  enabled: !_isSubmitting,
                  decoration: _inputDecoration(
                    hintText:
                        'Ex: Rua São João, Jd. São Pedro - próximo ao hospital',
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 24),
                const _FieldLabel(text: 'FOTO (opcional)'),
                const SizedBox(height: 12),
                _PhotoPickerRow(
                  photos: _photos,
                  canAdd: _photos.length < _maxPhotos && !_isSubmitting,
                  onAdd: _showPhotoOptions,
                  onRemove: _removePhoto,
                ),
                const SizedBox(height: 28),
                SizedBox(
                  height: 58,
                  child: ElevatedButton.icon(
                    key: const Key('new_ticket_submit_button'),
                    onPressed: _canSubmit ? _submit : null,
                    icon: _isSubmitting
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.share_outlined),
                    label: Text(
                      _isSubmitting ? 'Enviando...' : 'Enviar ticket',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: primaryColor.withValues(
                        alpha: 0.35,
                      ),
                      disabledForegroundColor: Colors.white.withValues(
                        alpha: 0.85,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    String? hintText,
    Color focusedBorderColor = const Color(0xFFD8DFDD),
  }) {
    return InputDecoration(
      filled: true,
      fillColor: const Color(0xFFEFF3F5),
      hintText: hintText,
      hintStyle: const TextStyle(color: Color(0xFF7A807D)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFD8DFDD)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFD8DFDD)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: focusedBorderColor, width: 1.4),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 1.4),
      ),
    );
  }
}

class _TicketTypeOption {
  final String value;
  final String label;
  final IconData icon;
  final Color color;

  const _TicketTypeOption({
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
  });
}

class _BackButtonCircle extends StatelessWidget {
  final bool enabled;

  const _BackButtonCircle({required this.enabled});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: enabled ? () => context.pop() : null,
      child: Container(
        width: 48,
        height: 48,
        decoration: const BoxDecoration(
          color: Color(0xFFE9EEF0),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.chevron_left, size: 30),
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  const _InfoBox();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFD9F5E3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF9FE7C3)),
      ),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(
            color: Color(0xFF111A15),
            fontSize: 16,
            height: 1.35,
          ),
          children: [
            const TextSpan(
              text: 'Ticket',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            const TextSpan(
              text:
                  ' = problema urbano a ser resolvido pela prefeitura. Para ideias, use ',
            ),
            WidgetSpan(
              alignment: PlaceholderAlignment.baseline,
              baseline: TextBaseline.alphabetic,
              child: GestureDetector(
                onTap: () {
                  context.go('/profile/suggestions');
                },
                child: const Text(
                  'Sugestões.',
                  style: TextStyle(
                    color: Color(0xFF007A3D),
                    fontSize: 15,
                    height: 1.35,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;

  const _FieldLabel({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFF4C5651),
        fontSize: 13,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.5,
      ),
    );
  }
}

class _TypeGrid extends StatelessWidget {
  final List<_TicketTypeOption> types;
  final String? selectedType;
  final bool enabled;
  final ValueChanged<String> onSelect;

  const _TypeGrid({
    required this.types,
    required this.selectedType,
    required this.enabled,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: types.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.32,
      ),
      itemBuilder: (context, index) {
        final type = types[index];
        final selected = selectedType == type.value;

        return InkWell(
          key: Key('new_ticket_type_${type.value}'),
          borderRadius: BorderRadius.circular(12),
          onTap: enabled ? () => onSelect(type.value) : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF3F5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: selected ? type.color : const Color(0xFFD8DFDD),
                width: selected ? 1.8 : 1,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  type.icon,
                  size: 30,
                  color: selected ? type.color : const Color(0xFF4D5A55),
                ),
                const SizedBox(height: 8),
                Text(
                  type.label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: selected ? type.color : const Color(0xFF4D5A55),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _PhotoPickerRow extends StatelessWidget {
  final List<NewTicketPhoto> photos;
  final bool canAdd;
  final VoidCallback onAdd;
  final ValueChanged<int> onRemove;

  const _PhotoPickerRow({
    required this.photos,
    required this.canAdd,
    required this.onAdd,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (var i = 0; i < photos.length; i++)
          _PhotoThumb(photo: photos[i], onRemove: () => onRemove(i)),
        if (canAdd)
          InkWell(
            key: const Key('new_ticket_add_photo_button'),
            borderRadius: BorderRadius.circular(12),
            onTap: onAdd,
            child: Container(
              width: 86,
              height: 86,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFFD8DFDD),
                  style: BorderStyle.solid,
                ),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add, size: 30, color: Color(0xFF4D5A55)),
                  SizedBox(height: 6),
                  Text(
                    'Adicionar',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF4D5A55),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _PhotoThumb extends StatelessWidget {
  final NewTicketPhoto photo;
  final VoidCallback onRemove;

  const _PhotoThumb({required this.photo, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.memory(
            photo.bytes,
            width: 86,
            height: 86,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          right: -5,
          top: -5,
          child: InkWell(
            onTap: onRemove,
            borderRadius: BorderRadius.circular(999),
            child: Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, size: 16, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
